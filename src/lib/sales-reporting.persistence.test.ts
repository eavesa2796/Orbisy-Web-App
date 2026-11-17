// @vitest-environment node
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, afterAll, afterEach, describe, expect, it, vi } from "vitest";
import type { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
const mocks = vi.hoisted(() => ({ db: null as unknown as ReturnType<typeof getDb>, getDb: vi.fn(), admin: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: () => { mocks.getDb(); return mocks.db; } }));
vi.mock("@/lib/auth", () => ({ requireAdmin: mocks.admin }));
import { getSalesSummary } from "@/lib/data/sales";
import { POST } from "@/app/api/analytics/route";
let pg: PGlite;
beforeAll(async () => {
    pg = new PGlite();
    for (const filename of (await readdir(join(process.cwd(), "drizzle"))).filter(n => /^\d{4}.*\.sql$/.test(n)).sort())
        await pg.exec((await readFile(join(process.cwd(), "drizzle", filename), "utf8")).replaceAll("--> statement-breakpoint", ""));
    mocks.db = drizzle(pg, { schema }) as unknown as ReturnType<typeof getDb>;
    mocks.admin.mockResolvedValue({ email: "admin@example.test" });
    const now = new Date();
    const past = new Date(now.getTime() - 120 * 86400000);
    const due = new Date(now.getTime() - 86400000);
    const [a, b, , d] = await mocks.db.insert(schema.contactSubmissions).values([
        { type: "project_request", name: "A", businessName: "Example A", email: "a@example.test", serviceNeeded: "Association websites", idempotencyKey: crypto.randomUUID(), consentVersion: "test", attribution: { landingPath: "/", submissionPath: "/", utmSource: "newsletter", utmMedium: "email", utmCampaign: "planning" } },
        { type: "project_request", name: "B", businessName: "Example B", email: "b@example.test", serviceNeeded: "Member portals", idempotencyKey: crypto.randomUUID(), consentVersion: "test" },
        { type: "project_request", name: "C", businessName: "Example C", email: "c@example.test", serviceNeeded: "Association websites", idempotencyKey: crypto.randomUUID(), consentVersion: "test" },
        { type: "project_request", name: "D", businessName: "Old inquiry", email: "d@example.test", serviceNeeded: "Association websites", idempotencyKey: crypto.randomUUID(), consentVersion: "test", submittedAt: past },
    ]).returning();
    await mocks.db.insert(schema.leads).values([{ businessName: "A", sourceName: "Website", submissionId: a.id, status: "won", followUpAt: due }, { businessName: "B", sourceName: "Website", submissionId: b.id, status: "proposal_sent", followUpAt: due }, { businessName: "D", sourceName: "Website", submissionId: d.id, status: "lost", followUpAt: due }, { businessName: "Imported lead", sourceName: "Reviewed list", status: "qualified", followUpAt: due }]);
    await mocks.db.insert(schema.clientWorkspaces).values([{ name: "Active proposal", status: "active", proposalStatus: "sent", updatedBy: "admin@example.test" }, { name: "Archived proposal", status: "archived", proposalStatus: "sent", updatedBy: "admin@example.test" }]);
    await mocks.db.insert(schema.analyticsEvents).values({ eventName: "page_view", sessionId: crypto.randomUUID(), pagePath: "/", occurredAt: past });
}, 30000);
afterAll(async () => pg.close());
afterEach(() => { mocks.admin.mockResolvedValue({ email: "admin@example.test" }); mocks.getDb.mockClear(); });
describe("Sales overview from saved records", () => {
    it("uses the saved-inquiry cohort, current statuses, and unknown source labels without counting imported leads as inquiries", async () => {
        const data = await getSalesSummary(30);
        expect(data.totals).toEqual({ inquiries: 3, progressing: 2, proposalPending: 1, won: 1, lost: 0 });
        expect(data.statuses).toContainEqual({ status: "saved", count: 1 });
        expect(data.sources).toContainEqual({ source: "Not captured", medium: "Not captured", campaign: "Not captured", count: 2, won: 0 });
        expect(data.sources).toContainEqual({ source: "newsletter", medium: "email", campaign: "planning", count: 1, won: 1 });
        expect(data.services).toContainEqual({ service: "Association websites", count: 2 });
        expect(data.recent).toHaveLength(3);
    });
    it("supports all-time and limits follow-ups to open leads while keeping workspace proposals separate", async () => { const data = await getSalesSummary(0); expect(data.totals.inquiries).toBe(4); expect(data.totals.lost).toBe(1); expect(data.followUpsDue).toBe(2); expect(data.followUps.map(x => x.status)).not.toContain("won"); expect(data.followUps.map(x => x.status)).not.toContain("lost"); expect(data.workspaceProposals).toBe(1); });
    it("does not delete historical events or change business records when reporting or acknowledging an old collector request", async () => { await getSalesSummary(7); expect((await POST()).status).toBe(204); const counts = await pg.query<{
        events: number;
        inquiries: number;
        leads: number;
    }>("select (select count(*)::int from analytics_events) as events,(select count(*)::int from contact_submissions) as inquiries,(select count(*)::int from leads) as leads"); expect(counts.rows[0]).toEqual({ events: 1, inquiries: 4, leads: 4 }); });
    it("requires administrator access before any database read", async () => { mocks.admin.mockRejectedValueOnce(Error("AUTH_REQUIRED")); await expect(getSalesSummary()).rejects.toThrow("AUTH_REQUIRED"); expect(mocks.getDb).not.toHaveBeenCalled(); });
});
