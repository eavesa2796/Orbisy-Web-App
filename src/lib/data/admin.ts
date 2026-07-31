import "server-only";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  leads,
  importBatches,
  importCandidates,
  leadNotes,
  manualContactAttempts,
  outreachDrafts,
  pipelineEvents,
  preflightJobs,
  auditEligibilityDecisions,
} from "@/lib/db/schema";
import type { leadStatusValues } from "@/lib/validation";

export type LeadStatus = (typeof leadStatusValues)[number];

export async function getOverviewData() {
  const db = getDb();
  const [counts, due, inbound, importSummary, preflightSummary] = await Promise.all([
    db
      .select({ status: leads.status, count: sql<number>`count(*)::int` })
      .from(leads)
      .groupBy(leads.status),
    db
      .select({
        id: leads.id,
        businessName: leads.businessName,
        status: leads.status,
        followUpAt: leads.followUpAt,
      })
      .from(leads)
      .where(lte(leads.followUpAt, new Date()))
      .orderBy(asc(leads.followUpAt))
      .limit(8),
    db
      .select({
        id: leads.id,
        businessName: leads.businessName,
        status: leads.status,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .where(eq(leads.status, "new_inbound"))
      .orderBy(desc(leads.priority), desc(leads.createdAt))
      .limit(8),
    db.execute<{
      pending_batches: number;
      review_rows: number;
      suppressed_candidates: number;
      newly_imported: number;
    }>(sql`
      SELECT
        (SELECT count(*)::int FROM ${importBatches}
          WHERE status IN ('draft', 'validating', 'ready', 'completed_with_errors'))
          AS pending_batches,
        (SELECT count(*)::int FROM ${importCandidates}
          WHERE status = 'needs_review') AS review_rows,
        (SELECT count(*)::int FROM ${importCandidates}
          WHERE status = 'suppressed') AS suppressed_candidates,
        (SELECT count(*)::int FROM ${leads}
          WHERE import_batch_id IS NOT NULL
            AND created_at >= NOW() - INTERVAL '30 days') AS newly_imported
    `),
    db.execute<{ attention: number; review: number; eligible: number }>(sql`
      SELECT
        (SELECT count(*)::int FROM ${preflightJobs} WHERE status IN ('failed','blocked')) AS attention,
        (SELECT count(*)::int FROM ${auditEligibilityDecisions} d WHERE status='needs_manual_review' AND decided_at=(SELECT max(d2.decided_at) FROM ${auditEligibilityDecisions} d2 WHERE d2.lead_id=d.lead_id)) AS review,
        (SELECT count(*)::int FROM ${auditEligibilityDecisions} d WHERE status='eligible' AND decided_at=(SELECT max(d2.decided_at) FROM ${auditEligibilityDecisions} d2 WHERE d2.lead_id=d.lead_id)) AS eligible
    `),
  ]);

  return {
    counts,
    due,
    inbound,
    importSummary: importSummary[0] ?? {
      pending_batches: 0,
      review_rows: 0,
      suppressed_candidates: 0,
      newly_imported: 0,
    },
    preflightSummary: preflightSummary[0] ?? { attention: 0, review: 0, eligible: 0 },
  };
}

export async function getLeads(options: {
  status?: LeadStatus;
  query?: string;
  page?: number;
  source?: string;
  industry?: string;
  location?: string;
  websiteState?: "unknown" | "provided" | "not_listed";
  importBatchId?: string;
  view?: string;
  importedAfter?: Date;
  pageSize?: number;
}) {
  const db = getDb();
  const page = Math.max(options.page ?? 1, 1);
  const pageSize = Math.min(Math.max(options.pageSize ?? 20, 10), 100);
  const filters = [
    options.status ? eq(leads.status, options.status) : undefined,
    options.query
      ? or(
          ilike(leads.businessName, `%${options.query}%`),
          ilike(leads.contactName, `%${options.query}%`),
          ilike(leads.email, `%${options.query}%`),
          ilike(leads.phone, `%${options.query}%`),
          ilike(leads.normalizedDomain, `%${options.query}%`),
          ilike(leads.city, `%${options.query}%`),
          ilike(leads.sourceIdentifier, `%${options.query}%`),
        )
      : undefined,
    options.source ? eq(leads.sourceName, options.source) : undefined,
    options.industry ? eq(leads.industry, options.industry) : undefined,
    options.location
      ? or(
          ilike(leads.location, `%${options.location}%`),
          ilike(leads.city, `%${options.location}%`),
        )
      : undefined,
    options.websiteState
      ? eq(leads.websiteState, options.websiteState)
      : undefined,
    options.importBatchId ? eq(leads.importBatchId, options.importBatchId) : undefined,
    options.importedAfter ? gte(leads.createdAt, options.importedAfter) : undefined,
    options.view === "newly_imported" ? isNotNull(leads.importBatchId) : undefined,
    options.view === "follow_up_due" ? lte(leads.followUpAt, new Date()) : undefined,
    options.view === "no_website"
      ? eq(leads.websiteState, "not_listed")
      : undefined,
  ].filter(Boolean);

  const where = filters.length ? and(...filters) : undefined;
  const [items, total] = await Promise.all([
    db
      .select()
      .from(leads)
      .where(where)
      .orderBy(desc(leads.priority), desc(leads.updatedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(leads)
      .where(where),
  ]);

  return { items, total: total[0]?.count ?? 0, page, pageSize };
}

export async function getLeadFilterOptions() {
  const db = getDb();
  const [sources, industries] = await Promise.all([
    db
      .selectDistinct({ value: leads.sourceName })
      .from(leads)
      .orderBy(leads.sourceName),
    db
      .selectDistinct({ value: leads.industry })
      .from(leads)
      .where(isNotNull(leads.industry))
      .orderBy(leads.industry),
  ]);
  return {
    sources: sources.map((item) => item.value),
    industries: industries.map((item) => item.value).filter(Boolean) as string[],
  };
}

export async function getLead(id: string) {
  const db = getDb();
  const [lead, notes, history, attempts, drafts] = await Promise.all([
    db.select().from(leads).where(eq(leads.id, id)).limit(1),
    db
      .select()
      .from(leadNotes)
      .where(eq(leadNotes.leadId, id))
      .orderBy(desc(leadNotes.createdAt)),
    db
      .select()
      .from(pipelineEvents)
      .where(eq(pipelineEvents.leadId, id))
      .orderBy(desc(pipelineEvents.createdAt)),
    db
      .select()
      .from(manualContactAttempts)
      .where(eq(manualContactAttempts.leadId, id))
      .orderBy(desc(manualContactAttempts.contactedAt)),
    db
      .select()
      .from(outreachDrafts)
      .where(eq(outreachDrafts.leadId, id))
      .orderBy(desc(outreachDrafts.updatedAt))
      .limit(1),
  ]);
  return { lead: lead[0] ?? null, notes, history, attempts, draft: drafts[0] ?? null };
}

export async function getAnalyticsSummary(days: number) {
  const db = getDb();
  const range = Math.min(Math.max(days, 1), 90);
  const since = sql`NOW() - (${range} * INTERVAL '1 day')`;

  const [totals, events, pages, referrers, devices, daily] = await Promise.all([
    db.execute<{ page_views: number; sessions: number }>(sql`
      SELECT
        count(*) FILTER (WHERE event_name = 'page_view')::int AS page_views,
        count(DISTINCT session_id)::int AS sessions
      FROM analytics_events WHERE occurred_at >= ${since}
    `),
    db.execute<{ event_name: string; count: number }>(sql`
      SELECT event_name, count(*)::int AS count
      FROM analytics_events WHERE occurred_at >= ${since}
      GROUP BY event_name ORDER BY count DESC
    `),
    db.execute<{ page_path: string; count: number }>(sql`
      SELECT page_path, count(*)::int AS count
      FROM analytics_events
      WHERE occurred_at >= ${since} AND event_name = 'page_view'
      GROUP BY page_path ORDER BY count DESC LIMIT 8
    `),
    db.execute<{ referrer_domain: string; count: number }>(sql`
      SELECT referrer_domain, count(*)::int AS count
      FROM analytics_events
      WHERE occurred_at >= ${since} AND referrer_domain IS NOT NULL
      GROUP BY referrer_domain ORDER BY count DESC LIMIT 8
    `),
    db.execute<{ device_category: string; count: number }>(sql`
      SELECT device_category, count(*)::int AS count
      FROM analytics_events
      WHERE occurred_at >= ${since} AND event_name = 'page_view'
      GROUP BY device_category ORDER BY count DESC
    `),
    db.execute<{ day: string; count: number }>(sql`
      SELECT to_char(date_trunc('day', occurred_at), 'YYYY-MM-DD') AS day,
        count(*) FILTER (WHERE event_name = 'page_view')::int AS count
      FROM analytics_events WHERE occurred_at >= ${since}
      GROUP BY date_trunc('day', occurred_at) ORDER BY date_trunc('day', occurred_at)
    `),
  ]);

  const eventMap = Object.fromEntries(
    events.map((event) => [event.event_name, Number(event.count)]),
  );
  return {
    days: range,
    pageViews: Number(totals[0]?.page_views ?? 0),
    sessions: Number(totals[0]?.sessions ?? 0),
    eventMap,
    pages,
    referrers,
    devices,
    daily,
  };
}
