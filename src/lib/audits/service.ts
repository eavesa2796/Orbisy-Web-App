import "server-only";

import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  adminActivityLogs,
  auditEligibilityDecisions,
  auditConfidenceScores,
  auditFindings,
  auditJobs,
  auditPages,
  auditReviewEvents,
  auditRuns,
  businessFitScores,
  leads,
  suppressionEntries,
  websiteImprovementScores,
} from "@/lib/db/schema";
import { getImportSettings } from "@/lib/imports/service";
import {
  AUDIT_VERSION,
  AUDIT_WORKER_LEASE_SECONDS,
  canQueueAudit,
  EXISTING_RELATIONSHIP_STATUSES,
  retryDelayMs,
} from "./policy";

async function hasSuppression(db: ReturnType<typeof getDb>, lead: typeof leads.$inferSelect) {
  const matches = await db.select({ id: suppressionEntries.id }).from(suppressionEntries)
    .where(or(
      eq(suppressionEntries.leadId, lead.id),
      lead.normalizedDomain ? eq(suppressionEntries.normalizedDomain, lead.normalizedDomain) : sql`false`,
      lead.normalizedEmail ? eq(suppressionEntries.normalizedEmail, lead.normalizedEmail) : sql`false`,
      lead.normalizedPhone ? eq(suppressionEntries.normalizedPhone, lead.normalizedPhone) : sql`false`,
      lead.sourceIdentifier ? eq(suppressionEntries.normalizedSourceIdentifier, lead.sourceIdentifier) : sql`false`,
    )).limit(1);
  return lead.status === "suppressed" || Boolean(lead.suppressedAt) || matches.length > 0;
}

export async function queueAuditJobs(leadIds: string[], actor: string) {
  const ids = [...new Set(leadIds)].slice(0, 50);
  if (!ids.length) return { queued: 0, blocked: 0 };
  const settings = await getImportSettings();
  if (!settings.deepAuditEnabled) throw new Error("Deep audits are disabled by the global kill switch.");
  const db = getDb();
  const today = await db.execute<{ count: number }>(sql`
    select count(*)::int as count from audit_jobs where created_at >= date_trunc('day', now())
  `);
  let remaining = Math.max(0, settings.maxAuditsPerDay - Number(today[0]?.count || 0));
  let queued = 0; let blocked = 0;
  await db.transaction(async (tx) => {
    for (const id of ids) {
      if (remaining <= 0) { blocked += 1; continue; }
      const [lead] = await tx.select().from(leads).where(eq(leads.id, id)).limit(1);
      if (!lead) { blocked += 1; continue; }
      const [decision] = await tx.select().from(auditEligibilityDecisions)
        .where(eq(auditEligibilityDecisions.leadId, id))
        .orderBy(desc(auditEligibilityDecisions.decidedAt)).limit(1);
      const [score] = decision?.scoreId
        ? await tx.select({ totalScore: businessFitScores.totalScore }).from(businessFitScores)
          .where(eq(businessFitScores.id, decision.scoreId)).limit(1)
        : [];
      const suppressionMatches = await tx.select({ id: suppressionEntries.id }).from(suppressionEntries)
        .where(or(
          eq(suppressionEntries.leadId, lead.id),
          lead.normalizedDomain ? eq(suppressionEntries.normalizedDomain, lead.normalizedDomain) : sql`false`,
          lead.normalizedEmail ? eq(suppressionEntries.normalizedEmail, lead.normalizedEmail) : sql`false`,
          lead.normalizedPhone ? eq(suppressionEntries.normalizedPhone, lead.normalizedPhone) : sql`false`,
        )).limit(1);
      const policy = canQueueAudit({
        eligibilityStatus: decision?.status || "not_evaluated",
        isAdministratorOverride: Boolean(decision?.isOverride),
        businessFitScore: score?.totalScore ?? null,
        minimumBusinessFitScore: settings.auditMinimumBusinessFitScore,
        suppressed: lead.status === "suppressed" || Boolean(lead.suppressedAt) || suppressionMatches.length > 0,
        exactDuplicate: lead.duplicateReviewStatus === "exact_duplicate",
        existingRelationship: EXISTING_RELATIONSHIP_STATUSES.has(lead.status),
      });
      if (!decision || !policy.allowed) { blocked += 1; continue; }
      const [recent] = await tx.select({ completedAt: auditJobs.completedAt }).from(auditJobs)
        .where(and(eq(auditJobs.leadId, lead.id), inArray(auditJobs.status, ["completed", "completed_with_warnings"])))
        .orderBy(desc(auditJobs.completedAt)).limit(1);
      if (recent?.completedAt && recent.completedAt > new Date(Date.now() - settings.reauditIntervalDays * 86_400_000)) { blocked += 1; continue; }
      const inserted = await tx.insert(auditJobs).values({
        leadId: lead.id,
        eligibilityDecisionId: decision.id,
        auditVersion: AUDIT_VERSION,
        maxAttempts: settings.auditRetryLimit,
        idempotencyKey: `${AUDIT_VERSION}:${lead.id}:${decision.id}:${Date.now()}`,
      }).onConflictDoNothing().returning({ id: auditJobs.id });
      if (inserted.length) { queued += 1; remaining -= 1; } else blocked += 1;
    }
    if (queued || blocked) await tx.insert(adminActivityLogs).values({
      adminEmail: actor,
      action: "audit.queue_requested",
      entityType: "audit_job",
      metadata: { queued, blocked, requested: ids.length },
    });
  });
  return { queued, blocked };
}

export async function claimAuditJobs(workerId: string, requestedLimit: number) {
  const db = getDb(); const settings = await getImportSettings();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('orbisy-deep-audit-claim'))`);
    await tx.execute(sql`
      update audit_jobs set
        status = case when attempt_count >= max_attempts then 'failed'::audit_job_status else 'retry_scheduled'::audit_job_status end,
        scheduled_at = case when attempt_count >= max_attempts then scheduled_at else now() end,
        completed_at = case when attempt_count >= max_attempts then now() else null end,
        worker_id = null, last_error = 'Worker lease expired before completion.',
        error_classification = 'worker_lease_expired', updated_at = now()
      where status = 'running'
        and claimed_at < now() - (${AUDIT_WORKER_LEASE_SECONDS} * interval '1 second')
    `);
    const running = await tx.execute<{ count: number }>(sql`select count(*)::int as count from audit_jobs where status='running'`);
    const available = Math.max(0, settings.maxConcurrentAudits - Number(running[0]?.count || 0));
    const limit = Math.min(Math.max(0, requestedLimit), settings.maxAuditJobsPerWorkerRun, available);
    if (!limit) return [];
    const claimed = await tx.execute<{ id: string }>(sql`
      with claimable as (
        select id from audit_jobs
        where status in ('queued','retry_scheduled') and scheduled_at <= now()
        order by priority desc, scheduled_at asc
        for update skip locked limit ${limit}
      ) update audit_jobs j set status='running', claimed_at=now(), worker_id=${workerId},
        attempt_count=j.attempt_count+1, updated_at=now()
      from claimable c where j.id=c.id returning j.id
    `);
    const claimedIds = claimed.map((row) => row.id);
    return claimedIds.length ? tx.select().from(auditJobs).where(inArray(auditJobs.id, claimedIds)) : [];
  });
}

export async function auditSuppressionStillClear(leadId: string) {
  const db = getDb();
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  return lead ? !(await hasSuppression(db, lead)) : false;
}

export async function failAuditJob(
  job: typeof auditJobs.$inferSelect,
  classification: string,
  retryable: boolean,
  permanentStatus: "failed" | "blocked" = "failed",
) {
  const db = getDb(); const settings = await getImportSettings();
  const retry = retryable && job.attemptCount < job.maxAttempts;
  await db.update(auditJobs).set({
    status: retry ? "retry_scheduled" : permanentStatus,
    scheduledAt: retry ? new Date(Date.now() + retryDelayMs(job.attemptCount, settings.auditRetryBackoffSeconds)) : job.scheduledAt,
    completedAt: retry ? null : new Date(), workerId: null,
    lastError: classification.replaceAll("_", " "), errorClassification: classification,
    updatedAt: new Date(),
  }).where(eq(auditJobs.id, job.id));
}

export async function cancelAuditJob(id: string, actor: string) {
  const db = getDb();
  await db.transaction(async (tx) => {
    const updated = await tx.update(auditJobs).set({ status: "cancelled", completedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(auditJobs.id, id), inArray(auditJobs.status, ["queued", "retry_scheduled"])))
      .returning({ id: auditJobs.id });
    if (!updated.length) throw new Error("Only queued or retry-scheduled audits can be cancelled.");
    await tx.insert(adminActivityLogs).values({ adminEmail: actor, action: "audit.cancelled", entityType: "audit_job", entityId: id });
  });
}

export async function retryAuditJob(id: string, actor: string) {
  const db = getDb();
  await db.transaction(async (tx) => {
    const updated = await tx.update(auditJobs).set({
      status: "queued", scheduledAt: new Date(), claimedAt: null, completedAt: null,
      attemptCount: 0,
      workerId: null, lastError: null, errorClassification: null, updatedAt: new Date(),
    }).where(and(eq(auditJobs.id, id), inArray(auditJobs.status, ["failed", "blocked"])))
      .returning({ id: auditJobs.id });
    if (!updated.length) throw new Error("Only failed or blocked audits can be retried.");
    await tx.insert(adminActivityLogs).values({ adminEmail: actor, action: "audit.retried", entityType: "audit_job", entityId: id });
  });
}

function safeLogError(error: unknown) {
  const value = error as { name?: unknown; code?: unknown } | null;
  return { name: typeof value?.name === "string" ? value.name.slice(0, 80) : "UnknownError", code: typeof value?.code === "string" ? value.code.slice(0, 80) : undefined };
}

export async function runAuditWorker(workerId: string) {
  const settings = await getImportSettings();
  if (!settings.deepAuditEnabled || !settings.deepAuditWorkerEnabled) return { claimed: 0, processed: 0, disabled: true };
  const jobs = await claimAuditJobs(workerId, settings.maxAuditJobsPerWorkerRun);
  const { processAuditJob } = await import("./processor");
  for (const job of jobs) {
    try { await processAuditJob(job); }
    catch (error) {
      console.error("[deep-audit-worker] job processing failed", { jobId: job.id, ...safeLogError(error) });
      await failAuditJob(job, "unexpected_processing_error", true);
    }
  }
  return { claimed: jobs.length, processed: jobs.length, disabled: false };
}

const visibleAuditStatuses = ["queued", "running", "completed", "completed_with_warnings", "failed", "blocked", "retry_scheduled", "cancelled"] as const;

export async function getAuditQueue(options: { status?: string; query?: string; page?: number }) {
  const db = getDb(); const page = Math.max(1, options.page || 1); const pageSize = 25;
  if (options.status === "eligible") {
    const where = and(
      eq(auditEligibilityDecisions.status, "eligible"),
      sql`${auditEligibilityDecisions.decidedAt}=(select max(d2.decided_at) from audit_eligibility_decisions d2 where d2.lead_id=${auditEligibilityDecisions.leadId})`,
      sql`not exists (select 1 from audit_jobs aj where aj.lead_id=${leads.id} and aj.status in ('queued','running','retry_scheduled'))`,
      options.query ? ilike(leads.businessName, `%${options.query}%`) : undefined,
    );
    const items = await db.select({ lead: leads, decision: auditEligibilityDecisions }).from(auditEligibilityDecisions)
      .innerJoin(leads, eq(leads.id, auditEligibilityDecisions.leadId)).where(where)
      .orderBy(desc(auditEligibilityDecisions.decidedAt)).limit(pageSize).offset((page - 1) * pageSize);
    return { mode: "eligible" as const, eligible: items, jobs: [], page, pageSize };
  }
  const status = visibleAuditStatuses.includes(options.status as typeof visibleAuditStatuses[number]) ? options.status as typeof visibleAuditStatuses[number] : undefined;
  const reviewFilter = options.status === "needs_verification"
    ? sql`exists (select 1 from audit_runs ar where ar.job_id=${auditJobs.id} and ar.status in ('completed','completed_with_warnings') and ar.review_completed_at is null)`
    : options.status === "verified"
      ? sql`exists (select 1 from audit_runs ar where ar.job_id=${auditJobs.id} and ar.review_completed_at is not null)`
      : undefined;
  const where = and(status ? eq(auditJobs.status, status) : undefined, reviewFilter, options.query ? ilike(leads.businessName, `%${options.query}%`) : undefined);
  const jobs = await db.select({ job: auditJobs, businessName: leads.businessName }).from(auditJobs)
    .innerJoin(leads, eq(leads.id, auditJobs.leadId)).where(where)
    .orderBy(desc(auditJobs.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
  return { mode: "jobs" as const, eligible: [], jobs, page, pageSize };
}

export async function getAuditDetail(jobId: string) {
  const db = getDb();
  const [record] = await db.select({ job: auditJobs, lead: leads, decision: auditEligibilityDecisions })
    .from(auditJobs).innerJoin(leads, eq(leads.id, auditJobs.leadId))
    .innerJoin(auditEligibilityDecisions, eq(auditEligibilityDecisions.id, auditJobs.eligibilityDecisionId))
    .where(eq(auditJobs.id, jobId)).limit(1);
  if (!record) return null;
  const runs = await db.select().from(auditRuns).where(eq(auditRuns.jobId, jobId)).orderBy(desc(auditRuns.createdAt));
  const latest = runs[0];
  const [pages, findings, scores, confidence, reviewEvents] = await Promise.all([
    latest ? db.select().from(auditPages).where(eq(auditPages.runId, latest.id)).orderBy(auditPages.createdAt) : [],
    latest ? db.select().from(auditFindings).where(eq(auditFindings.runId, latest.id)).orderBy(auditFindings.category, auditFindings.createdAt) : [],
    latest ? db.select().from(websiteImprovementScores).where(eq(websiteImprovementScores.runId, latest.id)).orderBy(desc(websiteImprovementScores.calculatedAt)) : [],
    latest ? db.select().from(auditConfidenceScores).where(eq(auditConfidenceScores.runId, latest.id)).orderBy(desc(auditConfidenceScores.calculatedAt)) : [],
    latest ? db.select().from(auditReviewEvents).where(eq(auditReviewEvents.runId, latest.id)).orderBy(desc(auditReviewEvents.createdAt)) : [],
  ]);
  return { ...record, runs, latest, pages, findings, scores, score: scores[0] || null, confidence: confidence[0] || null, reviewEvents };
}
