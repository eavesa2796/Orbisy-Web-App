import "server-only";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { auditEligibilityDecisions, businessFitScores, leads, preflightChecks, preflightJobs, preflightRuns, suppressionEntries } from "@/lib/db/schema";
import { getImportSettings } from "@/lib/imports/service";
import { safeFetch } from "./safe-fetch";
import { calculateBusinessFit, decideAuditEligibility } from "./scoring";

export const PREFLIGHT_VERSION = "preflight-v1";
export const WORKER_LEASE_SECONDS = 300;
export async function queuePreflightJobs(leadIds: string[], actor: string) {
  const ids = [...new Set(leadIds)].slice(0, 50); if (!ids.length) return 0;
  const settings = await getImportSettings(); if (!settings.preflightEnabled) throw new Error("Preflight is disabled by the global kill switch.");
  const db = getDb();
  const today = await db.execute<{ count: number }>(sql`select count(*)::int as count from preflight_jobs where created_at >= date_trunc('day', now())`);
  const remaining = Math.max(0, settings.maxPreflightJobsPerDay - Number(today[0]?.count || 0));
  const candidates = await db.select({ id: leads.id }).from(leads).where(and(inArray(leads.id, ids.slice(0, remaining)), sql`${leads.status} <> 'suppressed'`, sql`${leads.suppressedAt} is null`));
  let inserted = 0;
  await db.transaction(async (tx) => {
    for (const lead of candidates) {
      const result = await tx.insert(preflightJobs).values({ leadId: lead.id, preflightVersion: PREFLIGHT_VERSION, maxAttempts: settings.preflightRetryLimit, idempotencyKey: `${PREFLIGHT_VERSION}:${lead.id}:${Date.now()}` }).onConflictDoNothing().returning({ id: preflightJobs.id });
      inserted += result.length;
    }
    if (inserted) await tx.execute(sql`insert into admin_activity_logs (admin_email, action, entity_type, metadata) values (${actor}, 'preflight.queued', 'preflight_job', ${JSON.stringify({ count: inserted })}::jsonb)`);
  });
  return inserted;
}

export async function claimPreflightJobs(workerId: string, limit: number) {
  const db = getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`
      update preflight_jobs set
        status = case when attempt_count >= max_attempts then 'failed'::preflight_job_status else 'retry_scheduled'::preflight_job_status end,
        scheduled_at = case when attempt_count >= max_attempts then scheduled_at else now() end,
        completed_at = case when attempt_count >= max_attempts then now() else null end,
        worker_id = null,
        last_error = 'Worker lease expired before completion.',
        error_classification = 'worker_lease_expired',
        updated_at = now()
      where status = 'running'
        and claimed_at < now() - (${WORKER_LEASE_SECONDS} * interval '1 second')
    `);
    const claimed = await tx.execute<{ id: string }>(sql`
      with claimable as (
        select id from preflight_jobs where status in ('queued','retry_scheduled') and scheduled_at <= now()
        order by priority desc, scheduled_at asc for update skip locked limit ${limit}
      ) update preflight_jobs j set status='running', claimed_at=now(), worker_id=${workerId},
        attempt_count=j.attempt_count+1, updated_at=now() from claimable c where j.id=c.id returning j.id
    `);
    const ids = claimed.map((row) => row.id);
    if (!ids.length) return [];
    return tx.select().from(preflightJobs).where(inArray(preflightJobs.id, ids));
  });
}

function safeLogError(error: unknown) {
  const value = error as { name?: unknown; code?: unknown } | null;
  return {
    name: typeof value?.name === "string" ? value.name.slice(0, 80) : "UnknownError",
    code: typeof value?.code === "string" ? value.code.slice(0, 80) : undefined,
  };
}

function targetMatch(value: string | null, targets: string[]) {
  if (!value) return null;
  const normalized = value.toLowerCase(); return targets.some((target) => normalized.includes(target.toLowerCase()) || target.toLowerCase().includes(normalized));
}
function robotsAllows(body: string) {
  const lines = body.split(/\r?\n/).map((line) => line.replace(/#.*/, "").trim().toLowerCase());
  let applies = false;
  for (const line of lines) { if (line.startsWith("user-agent:")) applies = ["*", "orbistrypreflight", "orbisypreflight"].includes(line.slice(11).trim()); if (applies && line.startsWith("disallow:") && line.slice(9).trim() === "/") return false; }
  return true;
}
function safeError(error: unknown) {
  const code = error instanceof Error ? error.message : "unknown_error";
  const allowed = new Set(["invalid_url","unsupported_scheme","embedded_credentials","invalid_hostname","prohibited_hostname","ambiguous_ip","dns_no_addresses","dns_timeout","prohibited_address","response_too_large","overall_timeout","connection_timeout","too_many_redirects","unsupported_content_type"]);
  return allowed.has(code) ? code : "network_request_failed";
}

export async function processPreflightJob(job: typeof preflightJobs.$inferSelect) {
  const started = Date.now(); const db = getDb(); const settings = await getImportSettings();
  const [lead] = await db.select().from(leads).where(eq(leads.id, job.leadId)).limit(1);
  if (!lead) return finalizeFailure(job, "lead_not_found", false);
  const suppressions = await db.select({ id: suppressionEntries.id }).from(suppressionEntries).where(or(eq(suppressionEntries.leadId, lead.id), lead.normalizedDomain ? eq(suppressionEntries.normalizedDomain, lead.normalizedDomain) : sql`false`, lead.normalizedEmail ? eq(suppressionEntries.normalizedEmail, lead.normalizedEmail) : sql`false`)).limit(1);
  if (!settings.preflightEnabled || !settings.workerEnabled) return finalizeFailure(job, "kill_switch", false, "skipped");
  if (lead.status === "suppressed" || lead.suppressedAt || suppressions.length) return finalizeFailure(job, "suppressed", false, "blocked");
  const industryMatch = targetMatch(lead.industry || lead.category, settings.targetIndustries);
  const locationMatch = targetMatch(lead.location || [lead.city, lead.state].filter(Boolean).join(", "), settings.targetLocations);
  const exactDuplicate = lead.duplicateReviewStatus === "exact_duplicate";
  const checks: Array<{ checkType: string; status: "passed"|"failed"|"warning"|"blocked"|"unavailable"|"not_applicable"; explanation: string; evidence?: Record<string, unknown> }> = [];
  let fetched: Awaited<ReturnType<typeof safeFetch>> | null = null; let robots = "not_checked"; let errorCategory: string | null = null;
  if (lead.websiteState === "not_listed" || !lead.websiteUrl) checks.push({ checkType: "website_listing", status: "unavailable", explanation: "The imported source did not list a website; this does not prove no website exists." });
  else {
    try {
      const base = new URL(lead.websiteUrl); const opts = { maxRedirects: settings.maxRedirects, maxBytes: Math.min(settings.maxResponseBytes, 256_000), dnsTimeoutMs: settings.dnsTimeoutMs, connectionTimeoutMs: settings.connectionTimeoutMs, overallTimeoutMs: settings.overallRequestTimeoutMs, userAgent: settings.fetcherUserAgent };
      try { const robotResult = await safeFetch(new URL("/robots.txt", base).toString(), opts); robots = robotsAllows(robotResult.body) ? "allowed" : "disallowed"; } catch { robots = "unreachable"; }
      checks.push({ checkType: "robots", status: robots === "disallowed" ? "blocked" : robots === "unreachable" ? "warning" : "passed", explanation: robots === "disallowed" ? "robots.txt explicitly disallows the homepage." : robots === "unreachable" ? "robots.txt was unavailable; no explicit prohibition was inferred." : "robots.txt permits the homepage.", evidence: { robotsUrl: new URL("/robots.txt", base).toString(), result: robots } });
      if (robots !== "disallowed") fetched = await safeFetch(base.toString(), { ...opts, maxBytes: settings.maxResponseBytes });
    } catch (error) { errorCategory = safeError(error); }
  }
  const passed = Boolean(fetched && fetched.status >= 200 && fetched.status < 400);
  checks.push({ checkType: "homepage", status: passed ? "passed" : robots === "disallowed" ? "blocked" : "failed", explanation: passed ? "The safely fetched homepage returned a successful response." : robots === "disallowed" ? "Homepage fetching stopped for robots policy." : "The homepage could not be safely confirmed.", evidence: fetched ? { status: fetched.status, finalUrl: fetched.finalUrl, redirects: fetched.redirectCount, contentType: fetched.contentType } : {} });
  checks.push({ checkType: "target_industry", status: industryMatch === null ? "unavailable" : industryMatch ? "passed" : "warning", explanation: industryMatch === null ? "Industry data is unavailable." : industryMatch ? "Imported industry matches a configured target." : "Imported industry does not match configured targets." });
  checks.push({ checkType: "target_location", status: locationMatch === null ? "unavailable" : locationMatch ? "passed" : "warning", explanation: locationMatch === null ? "Location data is unavailable." : locationMatch ? "Imported location matches a configured target." : "Imported location does not match configured targets." });
  const runStatus = passed ? "passed" : robots === "disallowed" ? "blocked" : "failed";
  await db.transaction(async (tx) => {
    const [run] = await tx.insert(preflightRuns).values({ leadId: lead.id, jobId: job.id, preflightVersion: PREFLIGHT_VERSION, completedAt: new Date(), status: runStatus, originalUrl: lead.websiteUrl, normalizedUrl: lead.websiteUrl, finalUrl: fetched?.finalUrl, websiteListingState: lead.websiteState, dnsResult: fetched ? "public_addresses_validated" : null, addressClassification: fetched ? "public" : null, httpsResult: fetched?.finalUrl.startsWith("https:") ? "working" : fetched ? "http_only" : null, tlsResult: fetched?.finalUrl.startsWith("https:") ? "valid" : null, httpStatus: fetched?.status, redirectCount: fetched?.redirectCount, contentType: fetched?.contentType, robotsResult: robots, targetIndustryMatch: industryMatch, targetLocationMatch: locationMatch, duplicateState: exactDuplicate ? "exact_duplicate" : "no_exact_duplicate", suppressionState: "not_suppressed", durationMs: Date.now() - started, errorCategory, safeErrorSummary: errorCategory?.replaceAll("_", " "), evidenceSnapshot: { responseBodyStored: false } }).returning({ id: preflightRuns.id });
    await tx.insert(preflightChecks).values(checks.map((check) => ({ runId: run.id, preflightVersion: PREFLIGHT_VERSION, ...check, evidence: check.evidence || {} })));
    const fit = calculateBusinessFit({ industryMatch, locationMatch, hasPublicContact: Boolean(lead.email || lead.phone || passed), serviceSuitable: industryMatch, suppressed: false, exactDuplicate, existingDisqualifyingRelationship: ["contacted","replied","consultation","proposal_sent","won"].includes(lead.status) });
    const [score] = await tx.insert(businessFitScores).values({ leadId: lead.id, runId: run.id, scoreVersion: fit.version, totalScore: fit.total, factors: fit.factors, eligibilityGates: fit.gates, inputSnapshot: fit.inputSnapshot }).returning({ id: businessFitScores.id });
    const decision = decideAuditEligibility({ preflightPassed: passed, safeReachableWebsite: passed, suppressed: false, exactDuplicate, industryMatch, locationMatch, score: fit.total, minimumScore: settings.minimumBusinessFitScore, requireIndustry: settings.requireTargetIndustry, requireLocation: settings.requireTargetLocation, recentlyChecked: false, activeAuditOrJob: false });
    await tx.insert(auditEligibilityDecisions).values({ leadId: lead.id, runId: run.id, scoreId: score.id, status: decision.status, reasonCodes: decision.reasonCodes, explanation: decision.explanation });
    const retryable = Boolean(errorCategory && ["dns_timeout","overall_timeout","connection_timeout","network_request_failed"].includes(errorCategory) && job.attemptCount < job.maxAttempts);
    await tx.update(preflightJobs).set({ status: retryable ? "retry_scheduled" : runStatus, scheduledAt: retryable ? new Date(Date.now() + settings.retryBackoffSeconds * 1000 * 2 ** Math.max(0, job.attemptCount - 1)) : job.scheduledAt, completedAt: retryable ? null : new Date(), updatedAt: new Date(), lastError: errorCategory?.replaceAll("_", " "), errorClassification: errorCategory }).where(eq(preflightJobs.id, job.id));
    await tx.update(leads).set({ lastVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(leads.id, lead.id));
  });
}

async function finalizeFailure(job: typeof preflightJobs.$inferSelect, code: string, retryable: boolean, status: "failed"|"blocked"|"skipped" = "failed") {
  const db = getDb(); const settings = await getImportSettings(); const retry = retryable && job.attemptCount < job.maxAttempts;
  await db.update(preflightJobs).set({ status: retry ? "retry_scheduled" : status, scheduledAt: retry ? new Date(Date.now() + settings.retryBackoffSeconds * 1000 * 2 ** Math.max(0, job.attemptCount - 1)) : job.scheduledAt, completedAt: retry ? null : new Date(), lastError: code.replaceAll("_", " "), errorClassification: code, updatedAt: new Date() }).where(eq(preflightJobs.id, job.id));
}

export async function runWorker(workerId: string) {
  const settings = await getImportSettings(); if (!settings.preflightEnabled || !settings.workerEnabled) return { claimed: 0, processed: 0, disabled: true };
  const jobs = await claimPreflightJobs(workerId, Math.min(settings.maxJobsPerWorkerRun, settings.maxConcurrentJobs));
  const lastDomain = new Map<string, number>();
  for (const job of jobs) {
    const [lead] = await getDb().select({ websiteUrl: leads.websiteUrl }).from(leads).where(eq(leads.id, job.leadId)).limit(1);
    let domain: string | null = null; try { domain = lead?.websiteUrl ? new URL(lead.websiteUrl).hostname : null; } catch {}
    if (domain) { const wait = Math.max(0, (lastDomain.get(domain) || 0) + settings.perDomainDelayMs - Date.now()); if (wait) await new Promise(resolve => setTimeout(resolve, wait)); lastDomain.set(domain, Date.now()); }
    try { await processPreflightJob(job); } catch (error) {
      console.error("[preflight-worker] job processing failed", { jobId: job.id, ...safeLogError(error) });
      await finalizeFailure(job, "unexpected_processing_error", true);
    }
  }
  return { claimed: jobs.length, processed: jobs.length, disabled: false };
}

export async function getPreflightQueue(status?: string, page = 1) {
  const db = getDb(); const pageSize = 25; const where = status && ["queued","running","retry_scheduled","failed","blocked","passed","skipped","cancelled"].includes(status) ? eq(preflightJobs.status, status as typeof preflightJobs.$inferSelect.status) : undefined;
  const [items, total] = await Promise.all([db.select({ job: preflightJobs, businessName: leads.businessName }).from(preflightJobs).innerJoin(leads, eq(leads.id, preflightJobs.leadId)).where(where).orderBy(desc(preflightJobs.createdAt)).limit(pageSize).offset((Math.max(1,page)-1)*pageSize), db.select({ count: sql<number>`count(*)::int` }).from(preflightJobs).where(where)]);
  return { items, total: Number(total[0]?.count || 0), page: Math.max(1,page), pageSize };
}

export async function getPreflightDetail(id: string) {
  const db = getDb(); const [job] = await db.select({ job: preflightJobs, lead: leads }).from(preflightJobs).innerJoin(leads, eq(leads.id, preflightJobs.leadId)).where(eq(preflightJobs.id, id)).limit(1); if (!job) return null;
  const runs = await db.select().from(preflightRuns).where(eq(preflightRuns.jobId, id)).orderBy(desc(preflightRuns.createdAt)); const latest = runs[0];
  const [checks, scores, decisions] = await Promise.all([latest ? db.select().from(preflightChecks).where(eq(preflightChecks.runId, latest.id)) : [], db.select().from(businessFitScores).where(eq(businessFitScores.leadId, job.lead.id)).orderBy(desc(businessFitScores.calculatedAt)), db.select().from(auditEligibilityDecisions).where(eq(auditEligibilityDecisions.leadId, job.lead.id)).orderBy(desc(auditEligibilityDecisions.decidedAt))]);
  return { ...job, runs, checks, score: scores[0] || null, decision: decisions[0] || null };
}
