import "server-only";
import { and, asc, desc, eq, gte, lte, notInArray, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { clientWorkspaces, contactSubmissions, leads } from "@/lib/db/schema";
import type { SalesSummary } from "@/lib/sales-reporting";
export async function getSalesSummary(requestedDays = 30): Promise<SalesSummary> {
    await requireAdmin();
    const db = getDb();
    const days = [0, 7, 30, 90].includes(requestedDays) ? requestedDays : 30;
    const now = new Date();
    const cohort = days ? gte(contactSubmissions.submittedAt, new Date(now.getTime() - days * 86400000)) : undefined;
    const stage = sql<string> `coalesce(${leads.status}::text,'saved')`;
    const service = sql<string> `coalesce(nullif(btrim(${contactSubmissions.serviceNeeded}),''),'Not specified')`;
    const source = sql<string> `coalesce(nullif(btrim(${contactSubmissions.attribution}->>'utmSource'),''),nullif(btrim(${contactSubmissions.attribution}->>'referrerDomain'),''),'Not captured')`;
    const medium = sql<string> `coalesce(nullif(btrim(${contactSubmissions.attribution}->>'utmMedium'),''),'Not captured')`;
    const campaign = sql<string> `coalesce(nullif(btrim(${contactSubmissions.attribution}->>'utmCampaign'),''),'Not captured')`;
    const count = sql<number> `count(*)::int`;
    const due = and(lte(leads.followUpAt, now), notInArray(leads.status, ['won', 'lost', 'suppressed']));
    const [totals, statuses, services, sources, recent, followUps, dueCount, workspaceProposals] = await Promise.all([
        db.select({ inquiries: count, progressing: sql<number> `count(*) filter(where ${leads.status} in ('qualified','contact_planned','contacted','replied','consultation','proposal_sent','won'))::int`, proposalPending: sql<number> `count(*) filter(where ${leads.status}='proposal_sent')::int`, won: sql<number> `count(*) filter(where ${leads.status}='won')::int`, lost: sql<number> `count(*) filter(where ${leads.status}='lost')::int` }).from(contactSubmissions).leftJoin(leads, eq(leads.submissionId, contactSubmissions.id)).where(cohort),
        db.select({ status: stage, count }).from(contactSubmissions).leftJoin(leads, eq(leads.submissionId, contactSubmissions.id)).where(cohort).groupBy(stage).orderBy(desc(count)),
        db.select({ service, count }).from(contactSubmissions).where(cohort).groupBy(service).orderBy(desc(count)),
        db.select({ source, medium, campaign, count, won: sql<number> `count(*) filter(where ${leads.status}='won')::int` }).from(contactSubmissions).leftJoin(leads, eq(leads.submissionId, contactSubmissions.id)).where(cohort).groupBy(source, medium, campaign).orderBy(desc(count)),
        db.select({ id: contactSubmissions.id, leadId: leads.id, name: contactSubmissions.businessName, service, status: stage, source, campaign, submittedAt: contactSubmissions.submittedAt }).from(contactSubmissions).leftJoin(leads, eq(leads.submissionId, contactSubmissions.id)).where(cohort).orderBy(desc(contactSubmissions.submittedAt),desc(contactSubmissions.id)).limit(10),
        db.select({ id: leads.id, name: leads.businessName, status: leads.status, followUpAt: leads.followUpAt }).from(leads).where(due).orderBy(asc(leads.followUpAt)).limit(8),
        db.select({ count }).from(leads).where(due),
        db.select({ count }).from(clientWorkspaces).where(and(eq(clientWorkspaces.proposalStatus, 'sent'), notInArray(clientWorkspaces.status, ['archived']))),
    ]);
    return { days, totals: totals[0], statuses, services, sources, recent, followUps, followUpsDue: dueCount[0].count, workspaceProposals: workspaceProposals[0].count };
}
