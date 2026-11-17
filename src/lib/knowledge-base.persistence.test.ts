// @vitest-environment node
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from "vitest";
import type { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
const mock = vi.hoisted(() => ({ db: null as unknown as ReturnType<typeof getDb>, admin: vi.fn(), getDb: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: () => { mock.getDb(); return mock.db; } }));
vi.mock("@/lib/auth", () => ({ requireAdmin: mock.admin }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { saveKnowledgeAction, addKnowledgeStartersAction } from "@/app/admin-portal/knowledge-base/actions";
import { getPublicKnowledge, getKnowledgeEntries, getKnowledgeEntry } from "@/lib/data/knowledge-base";
import { knowledgeStarters } from "@/lib/knowledge-base-starters";
let pg: PGlite;
const initial = { success: false, message: "" };
function form(overrides: Record<string, string | number> = {}) { const f = new FormData(); Object.entries({ id: "", version: 0, ...knowledgeStarters[0], internalNotes: "PRIVATE EDITOR NOTES", reviewedOn: "2026-11-16", intent: "save_draft", ...overrides }).forEach(([k, v]) => f.set(k, String(v))); return f; }
beforeAll(async () => { pg = new PGlite(); await pg.exec("create role anon; create role authenticated; alter default privileges in schema public grant all on tables to anon, authenticated;"); for (const name of (await readdir(join(process.cwd(), "drizzle"))).filter(n => /^\d{4}.*\.sql$/.test(n)).sort())
    await pg.exec((await readFile(join(process.cwd(), "drizzle", name), "utf8")).replaceAll("--> statement-breakpoint", "")); mock.db = drizzle(pg, { schema }) as unknown as ReturnType<typeof getDb>; await pg.exec("insert into leads(business_name,source_name,status) values ('Keep existing lead','Prior record','new_inbound');"); }, 30000);
beforeEach(async () => { await pg.exec("delete from knowledge_articles; delete from admin_activity_logs where entity_type in ('knowledge_article','knowledge_catalog');"); mock.admin.mockResolvedValue({ id: "admin", email: "admin@example.test" }); mock.getDb.mockClear(); });
afterAll(async () => { await pg.close(); });
describe("Knowledge publishing and persistence", () => {
    it("keeps drafts private, publishes an explicit snapshot, and preserves it during draft edits", async () => {
        const draft = await saveKnowledgeAction(initial, form());
        expect(draft.success).toBe(true);
        expect(await getPublicKnowledge()).toEqual([]);
        const pub = await saveKnowledgeAction(initial, form({ id: draft.id!, version: 1, intent: "publish" }));
        expect(pub.success).toBe(true);
        const first = (await getPublicKnowledge())[0];
        expect(first.title).toBe(knowledgeStarters[0].title);
        expect(JSON.stringify(first)).not.toContain("PRIVATE EDITOR NOTES");
        expect(first).not.toHaveProperty("updatedBy");
        const edit = await saveKnowledgeAction(initial, form({ id: draft.id!, version: 2, title: "PRIVATE NEW DRAFT TITLE" }));
        expect(edit.success).toBe(true);
        expect((await getPublicKnowledge())[0].title).toBe(first.title);
        expect((await getKnowledgeEntry(draft.id!))?.title).toBe("PRIVATE NEW DRAFT TITLE");
        const published = await saveKnowledgeAction(initial, form({ id: draft.id!, version: 3, title: "Reviewed new article title", intent: "publish" }));
        expect(published.success).toBe(true);
        expect((await getPublicKnowledge())[0].revision).toBe(2);
        expect((await pg.query("select action from admin_activity_logs where entity_type='knowledge_article'")).rows).toHaveLength(4);
    });
    it("rejects stale writes, duplicate slugs, invalid publication, and changing a published address", async () => {
        const draft = await saveKnowledgeAction(initial, form());
        expect((await saveKnowledgeAction(initial, form())).success).toBe(false);
        expect((await saveKnowledgeAction(initial, form({ id: draft.id!, version: 0 }))).message).toContain("newer edit");
        expect((await saveKnowledgeAction(initial, form({ id: draft.id!, version: 1, intent: "publish", reviewedOn: "" }))).success).toBe(false);
        expect(await getPublicKnowledge()).toEqual([]);
        await saveKnowledgeAction(initial, form({ id: draft.id!, version: 1, intent: "publish" }));
        expect((await saveKnowledgeAction(initial, form({ id: draft.id!, version: 2, slug: "changed-address" }))).message).toContain("locked");
    });
    it("unpublishes and archives without deleting records; republishing restores availability", async () => {
        const draft = await saveKnowledgeAction(initial, form({ intent: "publish" }));
        expect((await getPublicKnowledge()).length).toBe(1);
        await saveKnowledgeAction(initial, form({ id: draft.id!, version: 1, intent: "unpublish" }));
        expect(await getPublicKnowledge()).toEqual([]);
        expect((await getKnowledgeEntries()).length).toBe(1);
        await saveKnowledgeAction(initial, form({ id: draft.id!, version: 2, intent: "publish" }));
        expect((await getPublicKnowledge()).length).toBe(1);
        await saveKnowledgeAction(initial, form({ id: draft.id!, version: 3, intent: "archive" }));
        expect(await getPublicKnowledge()).toEqual([]);
        expect((await getKnowledgeEntry(draft.id!))?.status).toBe("archived");
    });
    it("requires admin access before reads or writes, including starter imports", async () => {
        mock.admin.mockRejectedValue(new Error("AUTH_REQUIRED"));
        await expect(saveKnowledgeAction(initial, form())).rejects.toThrow("AUTH_REQUIRED");
        await expect(addKnowledgeStartersAction(initial)).rejects.toThrow("AUTH_REQUIRED");
        await expect(getKnowledgeEntries()).rejects.toThrow("AUTH_REQUIRED");
        await expect(getKnowledgeEntry(crypto.randomUUID())).rejects.toThrow("AUTH_REQUIRED");
        expect(mock.getDb).not.toHaveBeenCalled();
    });
    it("imports starter drafts idempotently, preserves existing leads, and denies direct API roles", async () => {
        expect((await addKnowledgeStartersAction(initial)).success).toBe(true);
        await addKnowledgeStartersAction(initial);
        expect((await getKnowledgeEntries()).length).toBe(6);
        expect(await getPublicKnowledge()).toEqual([]);
        expect((await pg.query("select business_name from leads where business_name='Keep existing lead'")).rows).toHaveLength(1);
        const result = await pg.query<{
            rls: boolean;
            anon_select: boolean;
            auth_write: boolean;
        }>("select relrowsecurity as rls,has_table_privilege('anon','public.knowledge_articles','SELECT') as anon_select,has_table_privilege('authenticated','public.knowledge_articles','UPDATE') as auth_write from pg_class where oid='public.knowledge_articles'::regclass");
        expect(result.rows[0]).toEqual({ rls: true, anon_select: false, auth_write: false });
    });
});
