"use server";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  adminActivityLogs,
  clientWorkspaces,
  clientLeadLinks,
  clientWorkspaceNotes,
  clientMilestones,
  discoveryBriefs,
  leads,
} from "@/lib/db/schema";
import {
  briefFields,
  workspaceSchema,
  discoverySchema,
  milestoneSchema,
  noteSchema,
  linkLeadSchema,
} from "@/lib/client-workspaces";
export type WorkspaceActionState = {
  success: boolean;
  message: string;
  recordId?: string;
  version?: number;
  values?: Record<string, string>;
  fields?: Record<string, string[]>;
};
const initialError = (
  message: string,
  values: Record<string, string>,
): WorkspaceActionState => ({ success: false, message, values });
function inputs(form: FormData) {
  return Object.fromEntries(
    [...form.entries()].filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}
function validationError(
  error: { issues: Array<{ path: PropertyKey[]; message: string }> },
  values: Record<string, string>,
): WorkspaceActionState {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (fields[key] ??= []).push(issue.message);
  }
  return { ...initialError("Review the highlighted fields.", values), fields };
}
function failure(error: unknown, values: Record<string, string>) {
  const code = error instanceof Error ? error.message : "";
  if (code === "EDIT_CONFLICT")
    return initialError(
      "This record changed in another tab. Reload it before saving again; your entries are retained below.",
      values,
    );
  if (code === "RECORD_NOT_FOUND")
    return initialError(
      "The selected workspace or record no longer exists. Reload and choose a current record.",
      values,
    );
  if (code === "LEAD_ALREADY_LINKED")
    return initialError(
      "This lead is already linked to another client workspace. Open that workspace from the lead record.",
      values,
    );
  console.error("Private workspace save failed", {
    name: error instanceof Error ? error.name : "UnknownError",
  });
  return initialError(
    "The change could not be saved. Check the database connection and client-workspace migration, then retry.",
    values,
  );
}
function refresh(workspaceId?: string) {
  revalidatePath("/admin-portal/dashboard");
  revalidatePath("/admin-portal/clients");
  revalidatePath("/admin-portal/leads");
  if (workspaceId)
    revalidatePath(`/admin-portal/clients/${workspaceId}`, "layout");
}
export async function saveWorkspaceAction(
  _previous: WorkspaceActionState,
  form: FormData,
): Promise<WorkspaceActionState> {
  const admin = await requireAdmin();
  const raw = inputs(form);
  const parsed = workspaceSchema.safeParse(raw);
  if (!parsed.success) return validationError(parsed.error, raw);
  const { id, version, mode, sourceLeadId, ...input } = parsed.data;
  try {
    const result = await getDb().transaction(async (tx) => {
      const values = {
        ...input,
        nextActionDate: input.nextActionDate || null,
        updatedBy: admin.email,
        updatedAt: new Date(),
      };
      let entry;
      if (mode === "create") {
        const [existing] = await tx
          .select()
          .from(clientWorkspaces)
          .where(eq(clientWorkspaces.id, id));
        if (existing) return existing;
        if (sourceLeadId) {
          const [lead] = await tx
            .select({ id: leads.id })
            .from(leads)
            .where(eq(leads.id, sourceLeadId));
          if (!lead) throw new Error("RECORD_NOT_FOUND");
          const [linked] = await tx
            .select()
            .from(clientLeadLinks)
            .where(eq(clientLeadLinks.leadId, sourceLeadId));
          if (linked) throw new Error("LEAD_ALREADY_LINKED");
        }
        [entry] = await tx
          .insert(clientWorkspaces)
          .values({ id, ...values })
          .returning();
        if (sourceLeadId)
          await tx
            .insert(clientLeadLinks)
            .values({ workspaceId: id, leadId: sourceLeadId });
      } else {
        [entry] = await tx
          .update(clientWorkspaces)
          .set({ ...values, version: sql`${clientWorkspaces.version}+1` })
          .where(
            and(
              eq(clientWorkspaces.id, id),
              eq(clientWorkspaces.version, version),
            ),
          )
          .returning();
        if (!entry) throw new Error("EDIT_CONFLICT");
      }
      await tx
        .insert(adminActivityLogs)
        .values({
          adminEmail: admin.email,
          action: mode === "create" ? "workspace_created" : "workspace_updated",
          entityType: "client_workspace",
          entityId: id,
          metadata: { status: input.status },
        });
      return entry;
    });
    refresh(id);
    return {
      success: true,
      message:
        mode === "create"
          ? "Client workspace created."
          : "Client workspace saved.",
      recordId: id,
      version: result.version,
      values: raw,
    };
  } catch (error) {
    return failure(error, raw);
  }
}
export async function saveDiscoveryAction(
  _previous: WorkspaceActionState,
  form: FormData,
): Promise<WorkspaceActionState> {
  const admin = await requireAdmin();
  const raw = inputs(form);
  const parsed = discoverySchema.safeParse(raw);
  if (!parsed.success) return validationError(parsed.error, raw);
  const p = parsed.data;
  const answers = Object.fromEntries(briefFields.map(([key]) => [key, p[key]]));
  try {
    const entry = await getDb().transaction(async (tx) => {
      const [workspace] = await tx
        .select({ id: clientWorkspaces.id })
        .from(clientWorkspaces)
        .where(eq(clientWorkspaces.id, p.workspaceId));
      if (!workspace) throw new Error("RECORD_NOT_FOUND");
      const values = {
        title: p.title,
        status: p.status,
        answers,
        updatedBy: admin.email,
        updatedAt: new Date(),
      };
      let entry;
      if (p.mode === "create") {
        const [existing] = await tx
          .select()
          .from(discoveryBriefs)
          .where(eq(discoveryBriefs.id, p.id));
        if (existing) {
          if (existing.workspaceId !== p.workspaceId)
            throw new Error("RECORD_NOT_FOUND");
          return existing;
        }
        [entry] = await tx
          .insert(discoveryBriefs)
          .values({ id: p.id, workspaceId: p.workspaceId, ...values })
          .returning();
      } else {
        [entry] = await tx
          .update(discoveryBriefs)
          .set({ ...values, version: sql`${discoveryBriefs.version}+1` })
          .where(
            and(
              eq(discoveryBriefs.id, p.id),
              eq(discoveryBriefs.workspaceId, p.workspaceId),
              eq(discoveryBriefs.version, p.version),
            ),
          )
          .returning();
        if (!entry) throw new Error("EDIT_CONFLICT");
      }
      await tx
        .insert(adminActivityLogs)
        .values({
          adminEmail: admin.email,
          action:
            p.mode === "create" ? "discovery_created" : "discovery_updated",
          entityType: "discovery_brief",
          entityId: p.id,
          metadata: {
            workspaceId: p.workspaceId,
            status: p.status,
            version: entry.version,
          },
        });
      return entry;
    });
    refresh(p.workspaceId);
    revalidatePath(`/admin-portal/clients/${p.workspaceId}/discovery/${p.id}`);
    return {
      success: true,
      message: "Discovery brief saved privately.",
      recordId: p.id,
      version: entry.version,
      values: raw,
    };
  } catch (error) {
    return failure(error, raw);
  }
}
export async function saveMilestoneAction(
  _previous: WorkspaceActionState,
  form: FormData,
): Promise<WorkspaceActionState> {
  const admin = await requireAdmin();
  const raw = inputs(form);
  const parsed = milestoneSchema.safeParse(raw);
  if (!parsed.success) return validationError(parsed.error, raw);
  const { id, workspaceId, mode, version, ...p } = parsed.data;
  try {
    const entry = await getDb().transaction(async (tx) => {
      const [workspace] = await tx
        .select({ id: clientWorkspaces.id })
        .from(clientWorkspaces)
        .where(eq(clientWorkspaces.id, workspaceId));
      if (!workspace) throw new Error("RECORD_NOT_FOUND");
      const values = {
        ...p,
        dueDate: p.dueDate || null,
        updatedBy: admin.email,
        updatedAt: new Date(),
      };
      let entry;
      if (mode === "create") {
        const [existing] = await tx
          .select()
          .from(clientMilestones)
          .where(eq(clientMilestones.id, id));
        if (existing) {
          if (existing.workspaceId !== workspaceId)
            throw new Error("RECORD_NOT_FOUND");
          return existing;
        }
        [entry] = await tx
          .insert(clientMilestones)
          .values({ id, workspaceId, ...values })
          .returning();
      } else {
        [entry] = await tx
          .update(clientMilestones)
          .set({ ...values, version: sql`${clientMilestones.version}+1` })
          .where(
            and(
              eq(clientMilestones.id, id),
              eq(clientMilestones.workspaceId, workspaceId),
              eq(clientMilestones.version, version),
            ),
          )
          .returning();
        if (!entry) throw new Error("EDIT_CONFLICT");
      }
      await tx
        .insert(adminActivityLogs)
        .values({
          adminEmail: admin.email,
          action: "milestone_saved",
          entityType: "client_milestone",
          entityId: id,
          metadata: { workspaceId, status: p.status },
        });
      return entry;
    });
    refresh(workspaceId);
    return {
      success: true,
      message: "Milestone saved.",
      recordId: id,
      version: entry.version,
      values: raw,
    };
  } catch (error) {
    return failure(error, raw);
  }
}
export async function addWorkspaceNoteAction(
  _previous: WorkspaceActionState,
  form: FormData,
): Promise<WorkspaceActionState> {
  const admin = await requireAdmin();
  const raw = inputs(form);
  const parsed = noteSchema.safeParse(raw);
  if (!parsed.success) return validationError(parsed.error, raw);
  const p = parsed.data;
  try {
    await getDb().transaction(async (tx) => {
      const [workspace] = await tx
        .select({ id: clientWorkspaces.id })
        .from(clientWorkspaces)
        .where(eq(clientWorkspaces.id, p.workspaceId));
      if (!workspace) throw new Error("RECORD_NOT_FOUND");
      const [note] = await tx
        .insert(clientWorkspaceNotes)
        .values({ ...p, createdBy: admin.email })
        .onConflictDoNothing({ target: clientWorkspaceNotes.id })
        .returning();
      if (note)
        await tx
          .insert(adminActivityLogs)
          .values({
            adminEmail: admin.email,
            action: "workspace_note_added",
            entityType: "client_workspace",
            entityId: p.workspaceId,
          });
    });
    refresh(p.workspaceId);
    return {
      success: true,
      message: "Private note added.",
      recordId: p.id,
      values: raw,
    };
  } catch (error) {
    return failure(error, raw);
  }
}
export async function linkLeadAction(
  _previous: WorkspaceActionState,
  form: FormData,
): Promise<WorkspaceActionState> {
  const admin = await requireAdmin();
  const raw = inputs(form);
  const parsed = linkLeadSchema.safeParse(raw);
  if (!parsed.success) return validationError(parsed.error, raw);
  const p = parsed.data;
  try {
    await getDb().transaction(async (tx) => {
      const [workspace] = await tx
        .select({ id: clientWorkspaces.id })
        .from(clientWorkspaces)
        .where(eq(clientWorkspaces.id, p.workspaceId));
      const [lead] = await tx
        .select({ id: leads.id })
        .from(leads)
        .where(eq(leads.id, p.leadId));
      if (!workspace || !lead) throw new Error("RECORD_NOT_FOUND");
      // Unique lead_id also protects concurrent link attempts.
      const [link] = await tx
        .insert(clientLeadLinks)
        .values(p)
        .onConflictDoNothing({ target: clientLeadLinks.leadId })
        .returning();
      if (!link) {
        const [existing] = await tx
          .select()
          .from(clientLeadLinks)
          .where(eq(clientLeadLinks.leadId, p.leadId));
        if (existing?.workspaceId !== p.workspaceId)
          throw new Error("LEAD_ALREADY_LINKED");
        return;
      }
      await tx
        .insert(adminActivityLogs)
        .values({
          adminEmail: admin.email,
          action: "workspace_lead_linked",
          entityType: "client_workspace",
          entityId: p.workspaceId,
          metadata: { leadId: p.leadId },
        });
    });
    refresh(p.workspaceId);
    revalidatePath(`/admin-portal/leads/${p.leadId}`);
    return {
      success: true,
      message:
        "Lead linked. Its original record and pipeline status are preserved.",
      values: raw,
    };
  } catch (error) {
    return failure(error, raw);
  }
}
