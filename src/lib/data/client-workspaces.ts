import "server-only";
import { and, asc, desc, eq, ilike, isNull, lte, ne, or, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  clientWorkspaces,
  clientLeadLinks,
  clientWorkspaceNotes,
  clientMilestones,
  discoveryBriefs,
  leads,
  contactSubmissions,
  submissionNotifications,
} from "@/lib/db/schema";
import { recordIdSchema, todayInChicago } from "@/lib/client-workspaces";

export async function workspaceSchemaAvailable() {
  await requireAdmin();
  const [row] = await getDb()
    .select({
      ready: sql<boolean>`to_regclass('public.client_workspaces') is not null and to_regclass('public.client_lead_links') is not null and to_regclass('public.discovery_briefs') is not null and to_regclass('public.client_milestones') is not null and to_regclass('public.client_workspace_notes') is not null`,
    })
    .from(sql`(select 1) as workspace_schema_check`);
  return row.ready;
}
export async function getClientWorkspaces({
  query = "",
  status = "",
  page = 1,
}: { query?: string; status?: string; page?: number } = {}) {
  await requireAdmin();
  const limit = 25;
  const currentPage = Math.min(
    10000,
    Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1),
  );
  const filter = and(
    status
      ? eq(clientWorkspaces.status, status)
      : ne(clientWorkspaces.status, "archived"),
    query.trim()
      ? or(
          ilike(clientWorkspaces.name, `%${query.trim().slice(0, 120)}%`),
          ilike(
            clientWorkspaces.contactEmail,
            `%${query.trim().slice(0, 120)}%`,
          ),
        )
      : undefined,
  );
  const [items, [count]] = await Promise.all([
    getDb()
      .select()
      .from(clientWorkspaces)
      .where(filter)
      .orderBy(desc(clientWorkspaces.updatedAt), asc(clientWorkspaces.id))
      .limit(limit)
      .offset((currentPage - 1) * limit),
    getDb()
      .select({ total: sql<number>`count(*)::int` })
      .from(clientWorkspaces)
      .where(filter),
  ]);
  return { items, total: count.total, page: currentPage, pageSize: limit };
}
export async function getClientWorkspace(id: string) {
  await requireAdmin();
  if (!recordIdSchema.safeParse(id).success) return null;
  const [workspace] = await getDb()
    .select()
    .from(clientWorkspaces)
    .where(eq(clientWorkspaces.id, id))
    .limit(1);
  return workspace ?? null;
}
export async function getWorkspaceContents(id: string) {
  await requireAdmin();
  if (!recordIdSchema.safeParse(id).success)
    throw new Error("INVALID_WORKSPACE");
  const [links, notes, briefs, milestones] = await Promise.all([
    getDb()
      .select({
        linkId: clientLeadLinks.id,
        lead: leads,
        submission: contactSubmissions,
      })
      .from(clientLeadLinks)
      .innerJoin(leads, eq(clientLeadLinks.leadId, leads.id))
      .leftJoin(
        contactSubmissions,
        eq(leads.submissionId, contactSubmissions.id),
      )
      .where(eq(clientLeadLinks.workspaceId, id))
      .orderBy(desc(leads.createdAt))
      .limit(100),
    getDb()
      .select()
      .from(clientWorkspaceNotes)
      .where(eq(clientWorkspaceNotes.workspaceId, id))
      .orderBy(
        desc(clientWorkspaceNotes.createdAt),
        desc(clientWorkspaceNotes.id),
      )
      .limit(50),
    getDb()
      .select()
      .from(discoveryBriefs)
      .where(eq(discoveryBriefs.workspaceId, id))
      .orderBy(desc(discoveryBriefs.updatedAt))
      .limit(50),
    getDb()
      .select()
      .from(clientMilestones)
      .where(eq(clientMilestones.workspaceId, id))
      .orderBy(
        sql`case when ${clientMilestones.status}='done' then 1 else 0 end`,
        asc(clientMilestones.dueDate),
        desc(clientMilestones.updatedAt),
      )
      .limit(50),
  ]);
  return { links, notes, briefs, milestones };
}
export async function getLeadWorkspace(leadId: string) {
  await requireAdmin();
  if (!recordIdSchema.safeParse(leadId).success) return null;
  const [row] = await getDb()
    .select({ id: clientWorkspaces.id, name: clientWorkspaces.name })
    .from(clientLeadLinks)
    .innerJoin(
      clientWorkspaces,
      eq(clientLeadLinks.workspaceId, clientWorkspaces.id),
    )
    .where(eq(clientLeadLinks.leadId, leadId))
    .limit(1);
  return row ?? null;
}
export async function getLeadForWorkspace(leadId: string) {
  await requireAdmin();
  if (!recordIdSchema.safeParse(leadId).success) return null;
  const [row] = await getDb()
    .select({
      id: leads.id,
      businessName: leads.businessName,
      contactName: leads.contactName,
      email: leads.email,
      websiteUrl: leads.websiteUrl,
    })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);
  return row ?? null;
}
export async function searchUnlinkedLeads(query: string) {
  await requireAdmin();
  if (!query.trim()) return [];
  return getDb()
    .select({ id: leads.id, name: leads.businessName, email: leads.email })
    .from(leads)
    .leftJoin(clientLeadLinks, eq(clientLeadLinks.leadId, leads.id))
    .where(
      and(
        isNull(clientLeadLinks.id),
        or(
          ilike(leads.businessName, `%${query.trim().slice(0, 120)}%`),
          ilike(leads.email, `%${query.trim().slice(0, 120)}%`),
        ),
      ),
    )
    .orderBy(asc(leads.businessName))
    .limit(20);
}
export async function getDiscoveryBrief(id: string, workspaceId?: string) {
  await requireAdmin();
  if (
    !recordIdSchema.safeParse(id).success ||
    (workspaceId && !recordIdSchema.safeParse(workspaceId).success)
  )
    return null;
  const [row] = await getDb()
    .select({ brief: discoveryBriefs, workspace: clientWorkspaces })
    .from(discoveryBriefs)
    .innerJoin(
      clientWorkspaces,
      eq(discoveryBriefs.workspaceId, clientWorkspaces.id),
    )
    .where(
      and(
        eq(discoveryBriefs.id, id),
        workspaceId ? eq(discoveryBriefs.workspaceId, workspaceId) : undefined,
      ),
    )
    .limit(1);
  return row ?? null;
}
export type AttentionItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  date?: string | null;
  urgent?: boolean;
  receivedAt?: string | null;
  receivedLabel?: "Received" | "Added";
};
export type AttentionQueue = {
  key: string;
  title: string;
  description: string;
  total: number;
  items: AttentionItem[];
};
export async function getAgencyDashboard() {
  await requireAdmin();
  const db = getDb();
  const now = new Date();
  const today = todayInChicago(now);
  // Core queues remain usable even if the workspace migration is not installed yet.
  const [inbound, followups, leadProposals, notifications] = await Promise.all([
    db
      .select({
        id: leads.id,
        title: leads.businessName,
        service: contactSubmissions.serviceNeeded,
        submissionId: leads.submissionId,
        receivedAt: contactSubmissions.submittedAt,
        createdAt: leads.createdAt,
        total: sql<number>`count(*) over()::int`,
      })
      .from(leads)
      .leftJoin(
        contactSubmissions,
        eq(leads.submissionId, contactSubmissions.id),
      )
      .where(eq(leads.status, "new_inbound"))
      .orderBy(desc(leads.createdAt))
      .limit(8),
    db
      .select({
        id: leads.id,
        title: leads.businessName,
        due: leads.followUpAt,
        total: sql<number>`count(*) over()::int`,
      })
      .from(leads)
      .where(
        and(
          lte(leads.followUpAt, now),
          sql`${leads.status} not in ('won','lost','suppressed')`,
        ),
      )
      .orderBy(asc(leads.followUpAt))
      .limit(8),
    db
      .select({
        id: leads.id,
        title: leads.businessName,
        total: sql<number>`count(*) over()::int`,
      })
      .from(leads)
      .where(eq(leads.status, "proposal_sent"))
      .orderBy(asc(leads.updatedAt))
      .limit(8),
    db
      .select({
        id: submissionNotifications.id,
        title: contactSubmissions.businessName,
        status: submissionNotifications.status,
        total: sql<number>`count(*) over()::int`,
      })
      .from(submissionNotifications)
      .innerJoin(
        contactSubmissions,
        eq(submissionNotifications.submissionId, contactSubmissions.id),
      )
      .where(
        sql`${submissionNotifications.status} in ('failed','not_configured')`,
      )
      .orderBy(desc(submissionNotifications.createdAt))
      .limit(8),
  ]);
  const queues: AttentionQueue[] = [
    {
      key: "inquiries",
      title: "New inquiries",
      description: "Read the request and arrange a conversation. Received / added times are shown in Chicago time (CST/CDT).",
      total: inbound[0]?.total ?? 0,
      items: inbound.map((r) => ({
        id: r.id,
        title: r.title,
        detail: r.service || "Website review",
        receivedAt: (r.submissionId ? r.receivedAt : r.createdAt)?.toISOString() ?? null,
        receivedLabel: r.submissionId ? "Received" : "Added",
        href: `/admin-portal/leads/${r.id}`,
      })),
    },
    {
      key: "followups",
      title: "Follow-ups due",
      description:
        "Scheduled follow-ups for open leads. Dates shown in Chicago time.",
      total: followups[0]?.total ?? 0,
      items: followups.map((r) => ({
        id: r.id,
        title: r.title,
        detail: "Lead follow-up",
        href: `/admin-portal/leads/${r.id}`,
        date: r.due?.toISOString() ?? null,
        urgent: true,
      })),
    },
    {
      key: "proposals",
      title: "Lead proposals awaiting response",
      description: "Existing leads marked proposal sent.",
      total: leadProposals[0]?.total ?? 0,
      items: leadProposals.map((r) => ({
        id: r.id,
        title: r.title,
        detail: "Proposal sent",
        href: `/admin-portal/leads/${r.id}`,
      })),
    },
    {
      key: "notifications",
      title: "Notification failures",
      description:
        "Saved inquiries remain available. Review or retry their email notification.",
      total: notifications[0]?.total ?? 0,
      items: notifications.map((r) => ({
        id: r.id,
        title: r.title,
        detail: r.status.replaceAll("_", " "),
        href: "/admin-portal/notifications",
        urgent: true,
      })),
    },
  ];
  let workspaceReady = false;
  let workspaceError = false;
  let activeClients: number | null = null;
  try {
    workspaceReady = await workspaceSchemaAvailable();
    if (workspaceReady) {
      const [actions, milestones, proposals, [active], unlinkedProposals] =
        await Promise.all([
          db
            .select({
              id: clientWorkspaces.id,
              title: clientWorkspaces.name,
              detail: clientWorkspaces.nextAction,
              date: clientWorkspaces.nextActionDate,
              total: sql<number>`count(*) over()::int`,
            })
            .from(clientWorkspaces)
            .where(
              and(
                sql`${clientWorkspaces.status} in ('prospect','active','paused')`,
                sql`${clientWorkspaces.nextActionDate} <= ${today}`,
              ),
            )
            .orderBy(asc(clientWorkspaces.nextActionDate))
            .limit(8),
          db
            .select({
              id: clientMilestones.id,
              workspaceId: clientWorkspaces.id,
              title: clientMilestones.title,
              name: clientWorkspaces.name,
              date: clientMilestones.dueDate,
              status: clientMilestones.status,
              total: sql<number>`count(*) over()::int`,
            })
            .from(clientMilestones)
            .innerJoin(
              clientWorkspaces,
              eq(clientMilestones.workspaceId, clientWorkspaces.id),
            )
            .where(
              and(
                ne(clientWorkspaces.status, "archived"),
                ne(clientMilestones.status, "done"),
                or(
                  eq(clientMilestones.status, "blocked"),
                  sql`${clientMilestones.dueDate} <= (${today}::date + 7)`,
                ),
              ),
            )
            .orderBy(
              sql`case when ${clientMilestones.status}='blocked' then 0 else 1 end`,
              asc(clientMilestones.dueDate),
            )
            .limit(8),
          db
            .select({
              id: clientWorkspaces.id,
              title: clientWorkspaces.name,
              total: sql<number>`count(*) over()::int`,
            })
            .from(clientWorkspaces)
            .where(
              and(
                ne(clientWorkspaces.status, "archived"),
                eq(clientWorkspaces.proposalStatus, "sent"),
              ),
            )
            .orderBy(asc(clientWorkspaces.updatedAt))
            .limit(8),
          db
            .select({ total: sql<number>`count(*)::int` })
            .from(clientWorkspaces)
            .where(eq(clientWorkspaces.status, "active")),
          db
            .select({
              id: leads.id,
              title: leads.businessName,
              total: sql<number>`count(*) over()::int`,
            })
            .from(leads)
            .leftJoin(clientLeadLinks, eq(clientLeadLinks.leadId, leads.id))
            .where(
              and(
                eq(leads.status, "proposal_sent"),
                isNull(clientLeadLinks.id),
              ),
            )
            .orderBy(asc(leads.updatedAt))
            .limit(8),
        ]);
      activeClients = active.total;
      const leadProposalQueue = queues.find(
        (queue) => queue.key === "proposals",
      )!;
      Object.assign(leadProposalQueue, {
        description:
          "Unlinked leads marked proposal sent. Linked records are managed in the client workspace.",
        total: unlinkedProposals[0]?.total ?? 0,
        items: unlinkedProposals.map((row) => ({
          id: row.id,
          title: row.title,
          detail: "Proposal sent",
          href: `/admin-portal/leads/${row.id}`,
        })),
      });
      queues.splice(2, 0, {
        key: "actions",
        title: "Client next actions",
        description:
          "Actions scheduled for today or earlier. Archived workspaces are excluded.",
        total: actions[0]?.total ?? 0,
        items: actions.map((r) => ({
          id: r.id,
          title: r.title,
          detail: r.detail,
          href: `/admin-portal/clients/${r.id}`,
          date: r.date,
          urgent: true,
        })),
      });
      queues.push({
        key: "milestones",
        title: "Milestones needing attention",
        description:
          "Blocked work and unfinished milestones due within seven days or overdue.",
        total: milestones[0]?.total ?? 0,
        items: milestones.map((r) => ({
          id: r.id,
          title: r.title,
          detail: `${r.name} · ${r.status}`,
          href: `/admin-portal/clients/${r.workspaceId}#milestones`,
          date: r.date,
          urgent: r.status === "blocked" || (!!r.date && r.date < today),
        })),
      });
      queues.push({
        key: "clientProposals",
        title: "Client proposals awaiting response",
        description:
          "Workspace proposal status; distinct from the original lead pipeline.",
        total: proposals[0]?.total ?? 0,
        items: proposals.map((r) => ({
          id: r.id,
          title: r.title,
          detail: "Follow up on the proposal",
          href: `/admin-portal/clients/${r.id}#workspace-details`,
        })),
      });
    }
  } catch {
    workspaceReady = false;
    workspaceError = true;
  }
  return { queues, workspaceReady, workspaceError, activeClients, today };
}
