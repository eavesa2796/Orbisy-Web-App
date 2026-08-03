import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  auditConfidenceScores, auditFindings, auditJobs, auditPages, auditRuns,
  leads, preflightRuns, scoreVersions, websiteImprovementScores,
} from "@/lib/db/schema";
import { getImportSettings } from "@/lib/imports/service";
import { safeFetch } from "@/lib/preflight/safe-fetch";
import { analyzeHtmlPage, type FindingDraft } from "./analyzers";
import { calculateAuditConfidence } from "./confidence";
import { assertSameRegistrableDomain, discoverInternalLinks, discoverUsefulPages, registrableDomain, robotsAllowsPath } from "./discovery";
import { RETRYABLE_AUDIT_ERRORS, safeAuditError } from "./errors";
import { inspectMobilePerformance } from "./pagespeed";
import { AUDIT_VERSION } from "./policy";
import { calculateWebsiteImprovement, CATEGORY_WEIGHTS, FINDING_POINTS, WEBSITE_SCORE_VERSION } from "./scoring";
import { auditSuppressionStillClear, failAuditJob } from "./service";

type PageResult = {
  requestedUrl: string; finalUrl?: string; pageType: string; selectionReason: string;
  status: "inspected" | "skipped" | "blocked" | "unavailable"; statusReason?: string;
  httpStatus?: number; contentType?: string; responseBytes?: number; redirectCount?: number;
  durationMs?: number; robotsResult?: string; errorClassification?: string; safeErrorSummary?: string;
};

function fetchOptions(settings: Awaited<ReturnType<typeof getImportSettings>>, domain: string, maxBytes: number) {
  return {
    maxRedirects: settings.auditMaxRedirects, maxBytes,
    dnsTimeoutMs: settings.auditDnsTimeoutMs, connectionTimeoutMs: settings.auditConnectionTimeoutMs,
    overallTimeoutMs: settings.auditPageTimeoutMs, userAgent: settings.fetcherUserAgent.replace("Preflight", "Audit"),
    validateRedirect: (url: URL) => assertSameRegistrableDomain(url, domain),
  };
}

export async function processAuditJob(job: typeof auditJobs.$inferSelect) {
  const db = getDb(); const settings = await getImportSettings(); const auditStarted = Date.now();
  if (!settings.deepAuditEnabled || !settings.deepAuditWorkerEnabled) return failAuditJob(job, "kill_switch", false, "blocked");
  if (!(await auditSuppressionStillClear(job.leadId))) return failAuditJob(job, "suppressed", false, "blocked");
  const [lead] = await db.select().from(leads).where(eq(leads.id, job.leadId)).limit(1);
  if (!lead) return failAuditJob(job, "lead_not_found", false);
  const [preflight] = await db.select().from(preflightRuns).where(and(eq(preflightRuns.leadId, lead.id), eq(preflightRuns.status, "passed"))).orderBy(desc(preflightRuns.createdAt)).limit(1);
  const homepageInput = preflight?.finalUrl || lead.websiteUrl;
  if (!homepageInput) return failAuditJob(job, "website_unavailable", false);

  const [run] = await db.insert(auditRuns).values({
    jobId: job.id, leadId: lead.id, auditVersion: AUDIT_VERSION,
    settingsSnapshot: { maxPages: settings.maxPagesPerAudit, maxLinks: settings.maxInternalLinksChecked, maxBytesPerPage: settings.maxResponseBytesPerPage, maxTotalBytes: settings.maxTotalBytesPerAudit },
  }).returning();
  const pages: PageResult[] = []; const findings: FindingDraft[] = []; let totalBytes = 0; let networkFailures = 0;
  let lastDomainRequestAt = 0;
  const honorDomainDelay = async () => {
    const wait = Math.max(0, lastDomainRequestAt + settings.auditPerDomainDelayMs - Date.now());
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    lastDomainRequestAt = Date.now();
  };
  const homepage = new URL(homepageInput); const domain = registrableDomain(homepage);
  let robotsBody = ""; let robotsResult = "unavailable";
  let sitemapResult = "unavailable";
  try {
    if (!(await auditSuppressionStillClear(lead.id))) throw new Error("suppressed");
    await honorDomainDelay();
    const robots = await safeFetch(new URL("/robots.txt", homepage).toString(), fetchOptions(settings, domain, Math.min(128_000, settings.maxResponseBytesPerPage)));
    robotsBody = robots.body; robotsResult = "available";
  } catch { robotsResult = "unavailable"; }

  const inspect = async (requestedUrl: string, pageType: string, selectionReason: string) => {
    if (Date.now() - auditStarted > settings.overallAuditTimeoutMs) throw new Error("audit_timeout");
    const parsed = new URL(requestedUrl); assertSameRegistrableDomain(parsed, domain);
    if (robotsBody && !robotsAllowsPath(robotsBody, parsed.pathname || "/")) {
      pages.push({ requestedUrl, pageType, selectionReason, status: "blocked", statusReason: "robots.txt disallows this path.", robotsResult: "disallowed" }); return null;
    }
    const started = Date.now();
    try {
      await honorDomainDelay();
      const remaining = settings.maxTotalBytesPerAudit - totalBytes;
      if (remaining <= 0) throw new Error("total_audit_bytes_exceeded");
      const fetched = await safeFetch(requestedUrl, fetchOptions(settings, domain, Math.min(settings.maxResponseBytesPerPage, remaining)));
      const bytes = Buffer.byteLength(fetched.body); totalBytes += bytes;
      pages.push({ requestedUrl, finalUrl: fetched.finalUrl, pageType, selectionReason, status: "inspected", httpStatus: fetched.status, contentType: fetched.contentType, responseBytes: bytes, redirectCount: fetched.redirectCount, durationMs: Date.now() - started, robotsResult });
      if (fetched.status >= 400) findings.push({ category: "reliability_security", findingType: "page_http_error", explanation: `The inspected page returned HTTP ${fetched.status}.`, evidence: { httpStatus: fetched.status }, affectedUrl: fetched.finalUrl, severity: fetched.status >= 500 ? "high" : "medium", confidence: "high", suggestedImprovement: "Restore the page or update internal links to a working destination." });
      const analyzed = analyzeHtmlPage(fetched.finalUrl, fetched.body); findings.push(...analyzed.findings);
      return fetched;
    } catch (error) {
      const classification = safeAuditError(error); networkFailures += 1;
      pages.push({ requestedUrl, pageType, selectionReason, status: classification === "cross_domain_destination" ? "blocked" : "unavailable", statusReason: classification.replaceAll("_", " "), errorClassification: classification, safeErrorSummary: classification.replaceAll("_", " "), durationMs: Date.now() - started, robotsResult });
      return null;
    }
  };

  try {
    const home = await inspect(homepage.toString(), "homepage", "Final validated homepage from Phase 3.");
    if (!home) throw new Error(pages.at(-1)?.status === "blocked" ? "robots_disallowed" : "homepage_unavailable");
    if (!home.finalUrl.startsWith("https:")) findings.push({ category: "reliability_security", findingType: "https_unavailable", explanation: "The final validated homepage uses unencrypted HTTP.", evidence: { finalProtocol: new URL(home.finalUrl).protocol }, affectedUrl: home.finalUrl, severity: "high", confidence: "high", suggestedImprovement: "Serve the website over HTTPS with a valid certificate and redirect HTTP traffic safely." });
    if (!robotsBody || robotsAllowsPath(robotsBody, "/sitemap.xml")) {
      try {
        const remaining = settings.maxTotalBytesPerAudit - totalBytes;
        if (remaining > 0) {
          await honorDomainDelay();
          const sitemap = await safeFetch(new URL("/sitemap.xml", home.finalUrl).toString(), fetchOptions(settings, domain, Math.min(128_000, remaining)));
          totalBytes += Buffer.byteLength(sitemap.body); sitemapResult = sitemap.status >= 200 && sitemap.status < 400 ? "available" : "unavailable";
        }
      } catch { sitemapResult = "unavailable"; }
    } else sitemapResult = "robots_disallowed";
    const selected = discoverUsefulPages(home.finalUrl, home.body, settings.maxPagesPerAudit);
    for (const page of selected) {
      if (!(await auditSuppressionStillClear(lead.id))) throw new Error("suppressed");
      await inspect(page.url, page.pageType, page.selectionReason);
    }
    const links = discoverInternalLinks(home.finalUrl, home.body, settings.maxInternalLinksChecked);
    let broken = 0; let checked = 0;
    for (const link of links) {
      if (checked >= settings.maxInternalLinksChecked || Date.now() - auditStarted > settings.overallAuditTimeoutMs) break;
      const path = new URL(link).pathname; if (robotsBody && !robotsAllowsPath(robotsBody, path)) continue;
      try {
        const remaining = settings.maxTotalBytesPerAudit - totalBytes; if (remaining <= 0) break;
        await honorDomainDelay();
        const result = await safeFetch(link, fetchOptions(settings, domain, Math.min(50_000, remaining)));
        totalBytes += Buffer.byteLength(result.body); checked += 1; if (result.status >= 400) broken += 1;
      } catch (error) { checked += 1; if (safeAuditError(error) !== "unsupported_content_type") broken += 1; }
    }
    if (broken) findings.push({ category: "technical_seo", findingType: "broken_internal_links", explanation: `${broken} of ${checked} bounded internal links checked were unavailable or returned an error.`, evidence: { checked, broken, skippedBecauseOfLimit: Math.max(0, links.length - checked) }, affectedUrl: home.finalUrl, severity: broken > 2 ? "medium" : "low", confidence: "medium", suggestedImprovement: "Update or remove internal links that do not resolve successfully." });

    const performance = await inspectMobilePerformance({ url: home.finalUrl, enabled: settings.pageSpeedEnabled, apiKey: process.env.PAGESPEED_API_KEY, timeoutMs: Math.min(20_000, settings.overallAuditTimeoutMs) });
    if (performance.available && performance.score !== null && performance.score < 70) findings.push({ category: "performance", findingType: "pagespeed_mobile_opportunity", explanation: `Google PageSpeed reported a mobile performance score of ${performance.score}/100.`, evidence: { provider: performance.provider, score: performance.score, executionMs: performance.executionMs }, affectedUrl: home.finalUrl, severity: performance.score < 50 ? "high" : "medium", confidence: "high", suggestedImprovement: "Review PageSpeed diagnostics and verify improvements with repeat measurements." });

    await db.transaction(async (tx) => {
      await tx.insert(auditPages).values(pages.map((page) => ({ runId: run.id, leadId: lead.id, inspectedAt: page.status === "inspected" ? new Date() : null, ...page })));
      const inserted = findings.length ? await tx.insert(auditFindings).values(findings.map((item) => ({ runId: run.id, leadId: lead.id, category: item.category, findingType: item.findingType, originalExplanation: item.explanation, evidence: item.evidence, affectedUrl: item.affectedUrl, severity: item.severity, confidence: item.confidence, source: "automated" as const, verificationStatus: "pending" as const, suggestedImprovement: item.suggestedImprovement, analyzerVersion: AUDIT_VERSION }))).returning() : [];
      await tx.insert(scoreVersions).values({ version: WEBSITE_SCORE_VERSION, categoryWeights: CATEGORY_WEIGHTS, rules: FINDING_POINTS, description: "Objective evidence-backed Website Improvement Score v1." }).onConflictDoNothing();
      const score = calculateWebsiteImprovement(inserted.map((item) => ({
        ...item, explanation: item.originalExplanation, affectedUrl: item.affectedUrl || "",
      })));
      const inspectedCount = pages.filter((page) => page.status === "inspected").length;
      const confidence = calculateAuditConfidence({ analyzersCompleted: 6, analyzersExpected: 7, pagesInspected: inspectedCount, pagesConfigured: settings.maxPagesPerAudit, providerAvailable: performance.available, networkFailures, parsingFailures: 0, conflictingResults: 0, manualReviewed: 0, manualRequired: inserted.filter((item) => item.verificationStatus === "pending").length });
      await tx.insert(websiteImprovementScores).values({ runId: run.id, leadId: lead.id, scoreVersion: score.version, categoryResults: score.categories, findingIds: score.findingIds, inputSnapshot: { findingTypes: inserted.map((item) => item.findingType), unavailablePerformance: !performance.available }, totalScore: score.total, scoreBand: score.band, coveragePercent: Math.round((6 / 7) * 100), provisional: true, manuallyReviewed: false });
      await tx.insert(auditConfidenceScores).values({ runId: run.id, level: confidence.level, factors: confidence.factors, explanation: confidence.explanation, calculationVersion: confidence.version });
      const warnings = pages.some((page) => page.status !== "inspected");
      await tx.update(auditRuns).set({ status: warnings ? "completed_with_warnings" : "completed", completedAt: new Date(), analyzerAvailability: { objectiveHtml: "available", robots: robotsResult, sitemap: sitemapResult, pagespeed: performance.available ? "available" : performance.errorClassification, linksChecked: checked, linksDiscovered: links.length } }).where(eq(auditRuns.id, run.id));
      await tx.update(auditJobs).set({ status: warnings ? "completed_with_warnings" : "completed", completedAt: new Date(), workerId: null, lastError: null, errorClassification: null, updatedAt: new Date() }).where(eq(auditJobs.id, job.id));
    });
  } catch (error) {
    const classification = safeAuditError(error);
    await db.update(auditRuns).set({ status: classification === "suppressed" ? "blocked" : "failed", completedAt: new Date(), errorClassification: classification, safeErrorSummary: classification.replaceAll("_", " ") }).where(eq(auditRuns.id, run.id));
    await failAuditJob(job, classification, RETRYABLE_AUDIT_ERRORS.has(classification), ["suppressed", "robots_disallowed", "cross_domain_destination"].includes(classification) ? "blocked" : "failed");
  }
}
