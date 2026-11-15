// @vitest-environment node
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
const mock = vi.hoisted(() => ({
  db: null as unknown as ReturnType<typeof getDb>,
  getDb: vi.fn(),
  admin: vi.fn(),
  identity: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  getDb: () => {
    mock.getDb();
    return mock.db;
  },
}));
vi.mock("@/lib/auth", () => ({
  requireAdmin: mock.admin,
  getAdminIdentity: mock.identity,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import {
  saveWorkspaceAction,
  saveDiscoveryAction,
  saveMilestoneAction,
  addWorkspaceNoteAction,
  linkLeadAction,
  unlinkLeadAction,
  type WorkspaceActionState,
} from "@/app/admin-portal/clients/actions";
import {
  getAgencyDashboard,
  getClientWorkspace,
  getClientWorkspaces,
  getWorkspaceContents,
  getDiscoveryBrief,
  getLeadWorkspace,
  searchUnlinkedLeads,
  workspaceSchemaAvailable,
} from "@/lib/data/client-workspaces";
import { GET } from "@/app/api/admin/discovery/[id]/route";
import { briefFields, todayInChicago } from "@/lib/client-workspaces";
let pg: PGlite;
let missingMigrationReady: boolean;
const state: WorkspaceActionState = { success: false, message: "" };
const actor = { id: "admin", email: "admin@example.test" };
const legacyLead = crypto.randomUUID();
const workspaceId = crypto.randomUUID();
let workspaceVersion = 1;
let briefId = "";
const form = (values: Record<string, string | number>) => {
  const result = new FormData();
  Object.entries(values).forEach(([key, value]) =>
    result.set(key, String(value)),
  );
  return result;
};
function workspace(overrides: Record<string, string | number> = {}) {
  return {
    id: workspaceId,
    version: workspaceVersion,
    mode: "create",
    sourceLeadId: "",
    name: "Example Association",
    status: "prospect",
    contactName: "Member Services",
    contactEmail: "membership@example.test",
    contactRole: "Membership",
    websiteUrl: "https://example.test",
    cms: "Existing CMS",
    platforms: "MemberClicks, Whova",
    vendorContacts: "Vendor support",
    accessNotes: "Password manager: Example CMS",
    currentScope: "Website and resource library",
    supportScope: "Not agreed",
    supportCapacity: "",
    supportBoundaries: "New features separately scoped",
    nextAction: "Arrange discovery",
    nextActionDate: todayInChicago(),
    proposalStatus: "scoping",
    proposalUrl: "",
    ...overrides,
  };
}
function brief(overrides: Record<string, string | number> = {}) {
  return {
    ...Object.fromEntries(briefFields.map(([key]) => [key, ""])),
    id: crypto.randomUUID(),
    workspaceId,
    mode: "create",
    version: 1,
    title: "Website discovery",
    status: "draft",
    ...overrides,
  };
}
beforeAll(async () => {
  pg = new PGlite();
  for (const name of (await readdir(join(process.cwd(), "drizzle")))
    .filter((name) => /^000[0-8].*sql$/.test(name))
    .sort())
    await pg.exec(
      (await readFile(join(process.cwd(), "drizzle", name), "utf8")).replaceAll(
        "--> statement-breakpoint",
        "",
      ),
    );
  await pg.query(
    "insert into leads(id,business_name,source_name,status) values($1,'Existing client lead','Existing inquiry','proposal_sent')",
    [legacyLead],
  );
  await pg.query(
    "insert into lead_notes(lead_id,body) values($1,'Original decision')",
    [legacyLead],
  );
  mock.db = drizzle(pg, { schema }) as unknown as ReturnType<typeof getDb>;
  mock.admin.mockResolvedValue(actor);
  mock.identity.mockResolvedValue(actor);
  missingMigrationReady = await workspaceSchemaAvailable();
  await pg.exec(
    "create role anon; create role authenticated; alter default privileges in schema public grant all on tables to anon, authenticated;",
  );
  await pg.exec(
    (
      await readFile(
        join(process.cwd(), "drizzle/0009_client_workspaces.sql"),
        "utf8",
      )
    ).replaceAll("--> statement-breakpoint", ""),
  );
}, 30000);
beforeEach(() => {
  mock.admin.mockResolvedValue(actor);
  mock.identity.mockResolvedValue(actor);
  mock.getDb.mockClear();
});
afterAll(async () => pg.close());
describe("Client workspace persistence and authorization", () => {
  it("adds five private tables without changing existing records", async () => {
    expect(missingMigrationReady).toBe(false);
    expect(await workspaceSchemaAvailable()).toBe(true);
    const [lead] = await mock.db
      .select()
      .from(schema.leads)
      .where(eq(schema.leads.id, legacyLead));
    expect(lead.status).toBe("proposal_sent");
    expect(
      (
        await mock.db
          .select()
          .from(schema.leadNotes)
          .where(eq(schema.leadNotes.leadId, legacyLead))
      )[0].body,
    ).toBe("Original decision");
    const security = await pg.query<{
      relrowsecurity: boolean;
      anon_select: boolean;
      auth_select: boolean;
    }>(
      "select relrowsecurity,has_table_privilege('anon',oid,'select') as anon_select,has_table_privilege('authenticated',oid,'select') as auth_select from pg_class where relname in ('client_workspaces','client_lead_links','client_workspace_notes','client_milestones','discovery_briefs')",
    );
    expect(security.rows).toHaveLength(5);
    expect(
      security.rows.every(
        (row) => row.relrowsecurity && !row.anon_select && !row.auth_select,
      ),
    ).toBe(true);
  });
  it("creates and idempotently retries a workspace while linking the original lead", async () => {
    const data = workspace({ sourceLeadId: legacyLead });
    const first = await saveWorkspaceAction(state, form(data));
    expect(first.success).toBe(true);
    workspaceVersion = first.version!;
    expect((await saveWorkspaceAction(state, form(data))).success).toBe(true);
    expect((await getClientWorkspaces()).total).toBe(1);
    expect((await getLeadWorkspace(legacyLead))?.id).toBe(workspaceId);
    expect((await getWorkspaceContents(workspaceId)).links[0].lead.status).toBe(
      "proposal_sent",
    );
  });
  it("rolls back a new workspace if its source lead is already linked or missing", async () => {
    const duplicateId = crypto.randomUUID();
    expect(
      (
        await saveWorkspaceAction(
          state,
          form(workspace({ id: duplicateId, sourceLeadId: legacyLead })),
        )
      ).success,
    ).toBe(false);
    expect(await getClientWorkspace(duplicateId)).toBeNull();
    const missingId = crypto.randomUUID();
    expect(
      (
        await saveWorkspaceAction(
          state,
          form(workspace({ id: missingId, sourceLeadId: crypto.randomUUID() })),
        )
      ).success,
    ).toBe(false);
    expect(await getClientWorkspace(missingId)).toBeNull();
  });
  it("prevents stale edits and preserves the newer workspace values", async () => {
    const first = await saveWorkspaceAction(
      state,
      form(workspace({ mode: "update", status: "active" })),
    );
    expect(first.success).toBe(true);
    const stale = await saveWorkspaceAction(
      state,
      form(workspace({ mode: "update", name: "Stale overwrite" })),
    );
    expect(stale.success).toBe(false);
    expect(stale.message).toContain("another tab");
    expect(stale.values?.name).toBe("Stale overwrite");
    expect((await getClientWorkspace(workspaceId))?.status).toBe("active");
    workspaceVersion = first.version!;
  });
  it("links existing inquiries once and rejects a competing client link", async () => {
    const leadId = crypto.randomUUID();
    await pg.query(
      "insert into leads(id,business_name,source_name,status) values($1,'Second request','Inbound','new_inbound')",
      [leadId],
    );
    expect((await searchUnlinkedLeads("Second request"))[0].id).toBe(leadId);
    const link = form({ workspaceId, leadId });
    expect((await linkLeadAction(state, link)).success).toBe(true);
    expect((await linkLeadAction(state, link)).success).toBe(true);
    expect(await searchUnlinkedLeads("Second request")).toHaveLength(0);
    const other = crypto.randomUUID();
    await saveWorkspaceAction(
      state,
      form(workspace({ id: other, name: "Other client" })),
    );
    expect(
      (await linkLeadAction(state, form({ workspaceId: other, leadId })))
        .success,
    ).toBe(false);
  });
  it("saves incomplete discovery drafts, validates readiness and checks parent context", async () => {
    const draft = brief({
      goals: "A staff-editable website",
      platforms: "MemberClicks API access to be confirmed",
    });
    briefId = draft.id as string;
    const saved = await saveDiscoveryAction(state, form(draft));
    expect(saved.success).toBe(true);
    expect(
      (await getDiscoveryBrief(briefId, workspaceId))?.brief.answers.platforms,
    ).toContain("to be confirmed");
    expect(await getDiscoveryBrief(briefId, crypto.randomUUID())).toBeNull();
    const incomplete = await saveDiscoveryAction(
      state,
      form({ ...draft, mode: "update", status: "ready" }),
    );
    expect(incomplete.success).toBe(false);
    expect(incomplete.fields?.acceptance).toBeTruthy();
    const complete = {
      ...draft,
      mode: "update",
      status: "ready",
      deliverables: "Five templates",
      exclusions: "No new AMS",
      responsibilities: "Supply content",
      acceptance: "Staff can edit and publish",
    };
    expect((await saveDiscoveryAction(state, form(complete))).success).toBe(
      true,
    );
    expect(
      (
        await saveDiscoveryAction(
          state,
          form({ ...complete, title: "Stale brief" }),
        )
      ).success,
    ).toBe(false);
    expect((await getDiscoveryBrief(briefId))?.brief.status).toBe("ready");
  });
  it("stores notes and milestone changes with idempotency and edit conflicts", async () => {
    const noteId = crypto.randomUUID();
    const note = form({
      id: noteId,
      workspaceId,
      body: "Decision: keep the existing membership system.",
    });
    expect((await addWorkspaceNoteAction(state, note)).success).toBe(true);
    expect((await addWorkspaceNoteAction(state, note)).success).toBe(true);
    expect((await getWorkspaceContents(workspaceId)).notes).toHaveLength(1);
    const item = {
      id: crypto.randomUUID(),
      workspaceId,
      version: 1,
      mode: "create",
      title: "Confirm vendor access",
      project: "Website project",
      status: "blocked",
      dueDate: "",
      nextStep: "Await vendor API documentation",
    };
    expect((await saveMilestoneAction(state, form(item))).success).toBe(true);
    expect(
      (
        await saveMilestoneAction(
          state,
          form({ ...item, mode: "update", status: "done" }),
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await saveMilestoneAction(
          state,
          form({ ...item, mode: "update", status: "open" }),
        )
      ).success,
    ).toBe(false);
  });
  it("uses complete counts above the visible row limit and excludes closed follow-ups", async () => {
    for (let i = 0; i < 11; i++)
      await pg.query(
        "insert into leads(business_name,source_name,status,follow_up_at) values($1,'Inbound','new_inbound',now()-interval '1 day')",
        [`Queue request ${i}`],
      );
    await pg.exec(
      "insert into leads(business_name,source_name,status,follow_up_at) values('Closed follow-up','Inbound','won',now()-interval '1 day')",
    );
    const dashboard = await getAgencyDashboard();
    expect(dashboard.workspaceReady).toBe(true);
    expect(dashboard.activeClients).toBe(1);
    const inbound = dashboard.queues.find(
      (queue) => queue.key === "inquiries",
    )!;
    expect(inbound.total).toBe(12);
    expect(inbound.items).toHaveLength(8);
    expect(
      dashboard.queues.find((queue) => queue.key === "followups")?.total,
    ).toBe(11);
    expect(
      dashboard.queues
        .find((queue) => queue.key === "actions")
        ?.items.some((item) => item.id === workspaceId),
    ).toBe(true);
    expect(
      dashboard.queues.find((queue) => queue.key === "milestones")?.total,
    ).toBe(0);
  });
  it("exports the saved brief only for an administrator with no caching", async () => {
    mock.identity.mockResolvedValueOnce(null);
    mock.getDb.mockClear();
    expect(
      (
        await GET(new Request("https://orbisy.example"), {
          params: Promise.resolve({ id: briefId }),
        })
      ).status,
    ).toBe(403);
    expect(mock.getDb).not.toHaveBeenCalled();
    const response = await GET(new Request("https://orbisy.example"), {
      params: Promise.resolve({ id: briefId }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    const text = await response.text();
    expect(text).toContain("Staff can edit and publish");
    expect(text).toContain("does not mean client approval");
  });
  it("removes only the exact relationship, preserves the original record, and rejects stale unlink requests", async () => {
    const { links } = await getWorkspaceContents(workspaceId);
    const original = links.find((entry) => entry.lead.id === legacyLead)!;
    const request = form({ workspaceId, leadId: legacyLead, linkId: original.linkId });
    expect((await unlinkLeadAction(state, request)).success).toBe(true);
    expect((await unlinkLeadAction(state, request)).success).toBe(true);
    expect(await getLeadWorkspace(legacyLead)).toBeNull();
    const [lead] = await mock.db.select().from(schema.leads).where(eq(schema.leads.id, legacyLead));
    expect(lead.status).toBe("proposal_sent");
    const notes = await mock.db.select().from(schema.leadNotes).where(eq(schema.leadNotes.leadId, legacyLead));
    expect(notes[0].body).toBe("Original decision");
    const audit = await pg.query<{count: number}>("select count(*)::int as count from admin_activity_logs where action='workspace_lead_unlinked'");
    expect(audit.rows[0].count).toBe(1);
    expect((await linkLeadAction(state, form({workspaceId, leadId: legacyLead}))).success).toBe(true);
    const recreated = (await getWorkspaceContents(workspaceId)).links.find((entry) => entry.lead.id === legacyLead)!;
    expect(recreated.linkId).not.toBe(original.linkId);
    expect((await unlinkLeadAction(state, request)).success).toBe(false);
    const other = (await getClientWorkspaces()).items.find((entry) => entry.id !== workspaceId)!;
    expect((await unlinkLeadAction(state, form({workspaceId: other.id, leadId: legacyLead, linkId: recreated.linkId}))).success).toBe(false);
    expect((await getLeadWorkspace(legacyLead))?.id).toBe(workspaceId);
  });
  it("manages linked proposals in the workspace queue without mutating their lead status", async () => {
    const current = await getClientWorkspace(workspaceId);
    expect((await saveWorkspaceAction(state, form(workspace({mode: "update", version: current!.version, status: "active", proposalStatus: "sent"})))).success).toBe(true);
    const dashboard = await getAgencyDashboard();
    expect(dashboard.queues.find((queue) => queue.key === "proposals")?.total).toBe(0);
    const clientQueue = dashboard.queues.find((queue) => queue.key === "clientProposals")!;
    expect(clientQueue.items.filter((entry) => entry.id === workspaceId)).toHaveLength(1);
    expect((await getWorkspaceContents(workspaceId)).links.find((entry) => entry.lead.id === legacyLead)?.lead.status).toBe("proposal_sent");
  });
  it("rejects non-admin reads and writes before touching the database", async () => {
    mock.admin.mockRejectedValue(new Error("AUTH_REQUIRED"));
    const calls = [
      () => getClientWorkspace(workspaceId),
      () => getAgencyDashboard(),
      () => getClientWorkspaces(),
      () => getWorkspaceContents(workspaceId),
      () => getDiscoveryBrief(briefId),
      () => getLeadWorkspace(legacyLead),
      () => searchUnlinkedLeads("Example"),
      () => saveWorkspaceAction(state, form(workspace())),
      () => saveDiscoveryAction(state, form(brief())),
      () => saveMilestoneAction(state, form({})),
      () => addWorkspaceNoteAction(state, form({})),
      () => linkLeadAction(state, form({})),
      () => unlinkLeadAction(state, form({})),
    ];
    for (const call of calls)
      await expect(call()).rejects.toThrow("AUTH_REQUIRED");
    expect(mock.getDb).not.toHaveBeenCalled();
  });
});
