import "server-only";

import { randomInt } from "node:crypto";
import { Readable, Transform } from "node:stream";
import { and, eq, inArray, sql } from "drizzle-orm";
import { parse } from "csv-parse";
import { load } from "cheerio";
import { getDb } from "@/lib/db";
import { associationProspects, associationScanJobs } from "@/lib/db/schema";
import { analyzeHtmlPage } from "@/lib/audits/analyzers";
import { registrableDomain, robotsAllowsPath } from "@/lib/audits/discovery";
import { safeFetch } from "@/lib/preflight/safe-fetch";

const BRAVE_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";
const SEARCH_LIMIT = 5;
const IRS_SOURCE_ROOT = "https://www.irs.gov/pub/irs-soi";
const IRS_SOURCE_MAX_BYTES = 100 * 1024 * 1024;
const VALID_STATES = new Set("AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA PR RI SC SD TN TX UT VT VA WA WV WI WY".split(" "));
const SAFE_ERROR_CODES = new Set([
  "search_not_configured", "search_rate_limited", "search_provider_unavailable",
  "search_response_invalid", "no_likely_website_match", "website_blocked_by_robots",
  "website_request_failed", "website_http_error", "website_unsupported_content", "cross_domain_redirect",
  "irs_source_unavailable", "irs_source_not_found", "irs_source_unexpected_type", "irs_source_too_large", "irs_source_parse_failed", "irs_job_configuration_invalid",
]);

type SearchResult = { title: string; url: string; description: string };
type Contact = { type: "email" | "phone"; value: string; sourceUrl: string };
type Evidence = { kind: string; summary: string; sourceUrl?: string; checkedAt?: string; confidence?: "low" | "medium" | "high" };

function normalizeText(value: string) {
  return value.toLowerCase().replace(/&amp;/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}

const directoryDomains = [
  "facebook.com", "linkedin.com", "instagram.com", "x.com", "youtube.com",
  "mapquest.com", "chamberofcommerce.com", "buzzfile.com", "causeiq.com",
  "guidestar.org", "opencorporates.com", "yahoo.com", "yelp.com", "yellowpages.com",
  "propublica.org", "bbb.org", "manta.com", "dnb.com", "crunchbase.com",
];
const genericNameTokens = new Set(["inc", "the", "and", "for", "of", "association", "associations",
  "society", "organization", "chamber", "commerce", "foundation", "corporation", "national", "state"]);

type WebsiteIdentity = { name: string; alternateName: string | null; city: string | null; state: string | null };

function nameTokens(value: string) {
  return [...new Set(normalizeText(value).split(" ").filter((word) => word.length >= 2 && !genericNameTokens.has(word)))];
}

export function associationSearchQuery(identity: WebsiteIdentity) {
  return [...new Set([identity.name, identity.alternateName, identity.city, identity.state].filter(Boolean))].join(" ");
}

export function chooseLikelyOfficialWebsite(identity: WebsiteIdentity, results: SearchResult[]) {
  const legalTokens = nameTokens(identity.name);
  const initials = normalizeText(identity.name).split(" ")
    .filter((word) => !["the", "for", "of", "and", "inc", "corporation"].includes(word))
    .map((word) => word[0]).join("");
  const alternate = identity.alternateName && normalizeText(identity.alternateName) !== normalizeText(identity.name)
    ? nameTokens(identity.alternateName) : [];
  const city = identity.city ? normalizeText(identity.city) : "";
  const candidates = new Map<string, { url: string; host: string; canScan: boolean; reason: string; score: number }>();

  for (const result of results) {
    let url: URL;
    try { url = new URL(result.url); } catch { continue; }
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) continue;
    const host = url.hostname.replace(/^www\./, "");
    if (directoryDomains.some((domain) => host === domain || host.endsWith(`.${domain}`))) continue;
    const title = new Set(normalizeText(result.title).split(" "));
    const path = new Set(normalizeText(url.pathname).split(" "));
    const domain = (registrableDomain(url)?.split(".")[0] || "").replace(/[^a-z0-9]/g, "");
    const legalMatches = legalTokens.filter((token) => title.has(token) || domain.includes(token)).length;
    const fullTitle = legalTokens.length > 0 && legalTokens.every((token) => title.has(token));
    const namedDomain = legalTokens.filter((token) => token.length >= 4 && domain.includes(token)).length >= 2;
    const acronymDomain = initials.length >= 4 && domain === initials && title.has(initials);
    const alternateMatch = alternate.length > 0 && alternate.every((token) => title.has(token) || path.has(token));
    if (legalMatches === 0 && !alternateMatch && !acronymDomain) continue;

    const locationText = ` ${normalizeText(`${result.title} ${result.description}`)} `;
    const matchesCity = Boolean(city && locationText.includes(` ${city} `));
    const description = new Set(normalizeText(result.description).split(" "));
    const supportsAcronym = acronymDomain && (matchesCity || legalTokens.every((token) => description.has(token)));
    const rootPage = url.pathname === "/";
    const supported = alternate.length
      ? alternateMatch && (fullTitle || matchesCity || namedDomain)
      : supportsAcronym || (fullTitle && (namedDomain || (rootPage && matchesCity)));
    const reason = alternate.length && !alternateMatch
      ? "The source names a local organization, but the result does not identify it."
      : supported
        ? alternate.length ? "The result identifies the alternate or chapter name with supporting organization or location evidence."
          : "The organization name and website domain or filing city agree."
        : "The search result needs more evidence to confirm the organization or chapter.";
    url.hash = "";
    if (supported && !alternate.length && (namedDomain || supportsAcronym)) {
      url.pathname = "/";
      url.search = "";
    }
    const score = (supported ? 100 : 0) + legalMatches * 2 + Number(matchesCity) + Number(rootPage);
    const previous = candidates.get(host);
    if (!previous || score > previous.score) candidates.set(host, { url: url.href, host, canScan: supported, reason, score });
  }

  const ranked = [...candidates.values()].sort((a, b) => b.score - a.score);
  const [best, second] = ranked;
  if (!best) return null;
  if (best.canScan && second?.canScan) {
    return { ...best, canScan: false, reason: "More than one website had strong matching evidence. Confirm the official site before scanning." };
  }
  return best;
}

export function mapEoBmfRow(row: string[], expectedState: string) {
  if (row.length !== 28) return null;
  const subsection = row[8]?.trim();
  const state = row[5]?.trim().toUpperCase();
  const organizationStatusCode = row[16]?.trim();
  if (subsection !== "06" || state !== expectedState || !["01", "02"].includes(organizationStatusCode || "")) return null;
  const ein = row[0]?.replace(/\D/g, "");
  const name = row[1]?.trim();
  if (!ein || !/^\d{9}$/.test(ein) || !name) return null;
  return {
    ein,
    name: name.slice(0, 200),
    alternateName: row[27]?.trim().slice(0, 200) || null,
    city: row[4]?.trim().slice(0, 120) || null,
    state,
    classificationCode: row[10]?.trim().slice(0, 4) || null,
    organizationStatusCode,
  };
}

async function searchWeb(identity: WebsiteIdentity) {
  const key = process.env.BRAVE_SEARCH_API_KEY?.trim();
  if (!key) throw new Error("search_not_configured");
  const query = associationSearchQuery(identity);
  let response: Response;
  try {
    response = await fetch(`${BRAVE_ENDPOINT}?${new URLSearchParams({ q: query, count: String(SEARCH_LIMIT), country: "US", search_lang: "en" })}`, {
      headers: { Accept: "application/json", "X-Subscription-Token": key },
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
  } catch {
    throw new Error("search_provider_unavailable");
  }
  if (response.status === 429) throw new Error("search_rate_limited");
  if (!response.ok) throw new Error("search_provider_unavailable");
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new Error("search_response_invalid"); }
  const results = (payload as { web?: { results?: unknown[] } })?.web?.results;
  if (!Array.isArray(results)) throw new Error("search_response_invalid");
  return {
    query,
    results: results.slice(0, SEARCH_LIMIT).flatMap((raw) => {
      if (!raw || typeof raw !== "object") return [];
      const item = raw as Record<string, unknown>;
      if (typeof item.url !== "string" || typeof item.title !== "string") return [];
      return [{ url: item.url.slice(0, 2000), title: item.title.slice(0, 300), description: typeof item.description === "string" ? item.description.slice(0, 1000) : "" }];
    }),
  };
}

function extractPublicContacts(html: string, sourceUrl: string): Contact[] {
  const $ = load(html);
  const emailValues = new Set<string>();
  const phoneValues = new Set<string>();
  $("a[href^='mailto:' i]").each((_index, element) => {
    const value = ($(element).attr("href") || "").replace(/^mailto:/i, "").split("?")[0]?.trim().toLowerCase();
    if (value && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) emailValues.add(value);
  });
  const visibleBody = $("body").clone();
  visibleBody.find("script,style,noscript,svg").remove();
  const text = visibleBody.text().replace(/\s+/g, " ").slice(0, 200_000);
  for (const match of text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) {
    const email = match[0].toLowerCase();
    if (email.length <= 254 && !/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(email)) emailValues.add(email);
    if (emailValues.size >= 10) break;
  }
  $("a[href^='tel:' i]").each((_index, element) => {
    const value = ($(element).attr("href") || "").replace(/^tel:/i, "").trim();
    const digits = value.replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 15) phoneValues.add(value.slice(0, 40));
  });
  return [
    ...[...emailValues].slice(0, 10).map((value) => ({ type: "email" as const, value, sourceUrl })),
    ...[...phoneValues].slice(0, 5).map((value) => ({ type: "phone" as const, value, sourceUrl })),
  ];
}

function evidenceSignals(html: string, pageUrl: string, checkedAt: string): Evidence[] {
  const $ = load(html);
  const text = normalizeText($.root().text().slice(0, 200_000));
  const linkText = normalizeText($("a").toArray().map((item) => `${$(item).text()} ${$(item).attr("href") || ""}`).join(" "));
  const evidence: Evidence[] = [];
  const signals: Array<[string, RegExp, string]> = [
    ["membership", /\b(join|membership|member login|member portal|renew membership)\b/, "A membership-related link or phrase was found on the homepage."],
    ["events", /\b(event registration|register for (an )?event|upcoming events|conference registration)\b/, "An event or registration-related phrase was found on the homepage."],
    ["online_payments", /\b(pay (your )?dues|pay online|online payment|dues payment)\b/, "An online payment or dues-related phrase was found on the homepage."],
  ];
  for (const [kind, pattern, summary] of signals) {
    if (pattern.test(`${text} ${linkText}`)) evidence.push({ kind, summary, sourceUrl: pageUrl, checkedAt, confidence: "medium" });
  }
  const copyrightYears = [...html.matchAll(/(?:©|copyright)[^\d]{0,30}(20\d{2})/gi)].map((match) => Number(match[1]));
  const oldYear = copyrightYears.length ? Math.max(...copyrightYears) : null;
  if (oldYear && oldYear <= new Date().getFullYear() - 4) evidence.push({ kind: "old_copyright_signal", summary: `A copyright date of ${oldYear} appears in the page source; this is only a weak freshness signal and is not proof the website is outdated.`, sourceUrl: pageUrl, checkedAt, confidence: "low" });
  return evidence;
}

function safeClassification(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (SAFE_ERROR_CODES.has(code)) return code;
  const networkCode = (error as { code?: unknown } | null)?.code;
  if (networkCode === "EAI_AGAIN" || networkCode === "ENOTFOUND") return "website_dns_unavailable";
  if (networkCode === "ECONNREFUSED" || networkCode === "ECONNRESET" || networkCode === "ETIMEDOUT") return "website_request_failed";
  if (["prohibited_hostname", "prohibited_address", "invalid_url", "unsupported_scheme", "embedded_credentials"].includes(code)) return "website_blocked_by_safety_policy";
  return "scan_processing_error";
}

function safeDisplay(code: string) {
  return code.replaceAll("_", " ").slice(0, 180);
}

async function claimOneJob(workerId: string) {
  const db = getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('association_scan_attempt_daily_limit'))`);
    const dailyAttempts = await tx.execute<{ count: number }>(sql`select count(*)::int as count from admin_activity_logs where action = 'association_scan.attempt_claimed' and created_at >= date_trunc('day', now())`);
    if (Number(dailyAttempts[0]?.count || 0) >= 20) return null;
    await tx.execute(sql`
      update association_scan_jobs set
        status = case when attempt_count >= max_attempts then 'failed'::association_scan_job_status else 'queued'::association_scan_job_status end,
        step = case when attempt_count >= max_attempts then 'failed' else 'queued' end,
        claimed_at = null, worker_id = null,
        last_error = 'Worker lease expired before completion.',
        error_classification = 'worker_lease_expired', updated_at = now()
      where status = 'running' and claimed_at < now() - interval '15 minutes'
    `);
    const claimed = await tx.execute<{ id: string }>(sql`
      with claimable as (
        select id from association_scan_jobs where status = 'queued'
        order by created_at asc for update skip locked limit 1
      ) update association_scan_jobs j set status='running', step='searching', claimed_at=now(), worker_id=${workerId},
        attempt_count=j.attempt_count+1, updated_at=now() from claimable c where j.id=c.id returning j.id
    `);
    if (!claimed[0]) return null;
    const [job] = await tx.select().from(associationScanJobs).where(eq(associationScanJobs.id, claimed[0].id)).limit(1);
    if (job) await tx.execute(sql`insert into admin_activity_logs (admin_email, action, entity_type, entity_id, metadata) values (${job.createdBy}, 'association_scan.attempt_claimed', 'association_scan_job', ${job.id}, ${JSON.stringify({ kind: job.kind, attempt: job.attemptCount })}::jsonb)`);
    return job || null;
  });
}

async function processIrsSampleJob(job: typeof associationScanJobs.$inferSelect) {
  const state = job.sourceState;
  if (!state || !VALID_STATES.has(state) || !job.sampleLimit || job.sampleLimit < 5 || job.sampleLimit > 25) throw new Error("irs_job_configuration_invalid");
  const sourceUrl = `${IRS_SOURCE_ROOT}/eo_${state.toLowerCase()}.csv`;
  await getDb().update(associationScanJobs).set({ step: "downloading_irs_file", updatedAt: new Date() }).where(eq(associationScanJobs.id, job.id));
  let response: Response;
  try {
    response = await fetch(sourceUrl, { headers: { Accept: "text/csv" }, signal: AbortSignal.timeout(90_000), cache: "no-store" });
  } catch {
    throw new Error("irs_source_unavailable");
  }
  if (!response.ok || !response.body) throw new Error(response.status === 404 ? "irs_source_not_found" : "irs_source_unavailable");
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.includes("text/csv") && !contentType.includes("application/octet-stream")) throw new Error("irs_source_unexpected_type");
  const announcedLength = Number(response.headers.get("content-length") || 0);
  if (announcedLength > IRS_SOURCE_MAX_BYTES) throw new Error("irs_source_too_large");
  await getDb().update(associationScanJobs).set({ step: "sampling_501c6_records", updatedAt: new Date() }).where(eq(associationScanJobs.id, job.id));

  let bytes = 0;
  let scannedRows = 0;
  let populationCount = 0;
  const reservoir: Array<{ ein: string; name: string; alternateName: string | null; city: string | null; state: string; classificationCode: string | null; organizationStatusCode: string }> = [];
  const limiter = new Transform({ transform(chunk: Buffer, _encoding, callback) {
    bytes += chunk.length;
    if (bytes > IRS_SOURCE_MAX_BYTES) callback(new Error("irs_source_too_large"));
    else callback(null, chunk);
  } });
  const parser = Readable.fromWeb(response.body as unknown as import("node:stream/web").ReadableStream<Uint8Array>).pipe(limiter).pipe(parse({ bom: true, skip_empty_lines: true, relax_quotes: false }));
  try {
    for await (const row of parser as AsyncIterable<string[]>) {
      scannedRows += 1;
      const record = mapEoBmfRow(row, state);
      if (!record) continue;
      populationCount += 1;
      const limit = job.sampleLimit;
      if (reservoir.length < limit) reservoir.push(record);
      else {
        const slot = randomInt(populationCount);
        if (slot < limit) reservoir[slot] = record;
      }
      if (scannedRows % 50_000 === 0) {
        await getDb().update(associationScanJobs).set({ sourcePopulationCount: populationCount, updatedAt: new Date() }).where(eq(associationScanJobs.id, job.id));
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === "irs_source_too_large") throw error;
    throw new Error("irs_source_parse_failed");
  }

  const db = getDb();
  let importedCount = 0;
  await db.transaction(async (tx) => {
    for (const record of reservoir) {
      const inserted = await tx.insert(associationProspects).values({
        ...record,
        sourceName: "IRS Exempt Organizations Business Master File",
        sourceUrl,
        sourceCheckedAt: new Date(),
      }).onConflictDoNothing({ target: associationProspects.ein }).returning({ id: associationProspects.id });
      importedCount += inserted.length;
    }
    await tx.execute(sql`insert into admin_activity_logs (admin_email, action, entity_type, entity_id, metadata) values (${job.createdBy}, 'association_irs.sample_imported', 'association_scan_job', ${job.id}::uuid, ${JSON.stringify({ state, sampleLimit: job.sampleLimit, populationCount, selectedCount: reservoir.length, insertedCount: importedCount, sourceUrl })}::jsonb)`);
  });
  await db.update(associationScanJobs).set({ status: "completed", step: "complete", sourcePopulationCount: populationCount, sourceImportedCount: importedCount, completedAt: new Date(), lastError: null, errorClassification: null, updatedAt: new Date() }).where(eq(associationScanJobs.id, job.id));
  return { status: "completed", step: "complete", populationCount, selectedCount: reservoir.length, importedCount };
}

export function selectedAssociationWebsite(record: Pick<typeof associationProspects.$inferSelect, "websiteUrl" | "reviewStatus" | "evidence">) {
  if (record.reviewStatus !== "confirmed" && record.evidence.some((item) => item.kind === "search_review")) return null;
  return record.websiteUrl;
}

export async function processAssociationScanJob(job: typeof associationScanJobs.$inferSelect) {
  if (!job.prospectId) throw new Error("prospect_record_missing");
  const db = getDb();
  const [prospect] = await db.select().from(associationProspects).where(eq(associationProspects.id, job.prospectId)).limit(1);
  if (!prospect) throw new Error("prospect_record_missing");
  const now = new Date();
  const checkedAt = now.toISOString();
  const submittedUrl = selectedAssociationWebsite(prospect);
  const result = submittedUrl ? null : await searchWeb(prospect);
  const candidate = submittedUrl
    ? { url: submittedUrl, canScan: true, reason: "Website URL supplied by the administrator." }
    : chooseLikelyOfficialWebsite(prospect, result?.results || []);
  const searchSourceUrl = result ? `https://search.brave.com/search?q=${encodeURIComponent(result.query)}` : undefined;
  const evidence: Evidence[] = [{
    kind: submittedUrl ? "admin_provided_website" : candidate ? "website_candidate" : "website_discovery",
    summary: candidate?.reason || "Search returned no suitable official-site candidate. The website remains unresolved.",
    sourceUrl: candidate?.url || searchSourceUrl,
    checkedAt,
    confidence: candidate?.canScan ? "medium" : "low",
  }];

  if (candidate && searchSourceUrl) {
    evidence.push({ kind: "search_query", summary: "Search used the saved organization name, alternate name and location when available.", sourceUrl: searchSourceUrl, checkedAt });
  }

  // Keep discovery evidence even when the eventual HTTP request fails.
  await db.update(associationProspects).set({
    websiteUrl: submittedUrl,
    websiteCondition: candidate?.canScan ? "unassessed" : "website_not_confirmed",
    publicContacts: [],
    evidence,
    lastCheckedAt: now,
    updatedAt: now,
  }).where(eq(associationProspects.id, prospect.id));

  if (!candidate?.canScan) {
    await db.update(associationScanJobs).set({ status: "completed", step: "complete", completedAt: now, lastError: null, errorClassification: null, updatedAt: now }).where(eq(associationScanJobs.id, job.id));
    return { status: "completed", step: "complete" };
  }

  const normalizedUrl = new URL(candidate.url);
  const websiteUrl = normalizedUrl.toString();
  const safeOptions = { maxRedirects: 4, maxBytes: 350_000, dnsTimeoutMs: 4000, connectionTimeoutMs: 7000, overallTimeoutMs: 15_000, userAgent: "OrbisyAssociationResearch/1.0 (+https://www.orbisy.com)" };
  let robotsBlocked = false;
  try {
    const robotsUrl = new URL("/robots.txt", normalizedUrl).toString();
    const robots = await safeFetch(robotsUrl, { ...safeOptions, maxBytes: 100_000, validateRedirect: (redirectUrl) => {
      if (registrableDomain(redirectUrl) !== registrableDomain(normalizedUrl)) throw new Error("cross_domain_redirect");
    } });
    if (!robotsAllowsPath(robots.body, normalizedUrl.pathname, "OrbisyAssociationResearch")) robotsBlocked = true;
  } catch (error) {
    if (error instanceof Error && error.message === "cross_domain_redirect") throw error;
    evidence.push({ kind: "robots_unavailable", summary: "robots.txt could not be read; no permission inference was made from the failed request.", sourceUrl: new URL("/robots.txt", normalizedUrl).toString(), checkedAt, confidence: "low" });
  }
  if (robotsBlocked) {
    evidence.push({ kind: "robots_policy", summary: "The site's robots.txt disallows the homepage path; content fetching stopped.", sourceUrl: new URL("/robots.txt", normalizedUrl).toString(), checkedAt, confidence: "high" });
    await db.update(associationProspects).set({ websiteCondition: "blocked", evidence, lastCheckedAt: now, updatedAt: now }).where(eq(associationProspects.id, prospect.id));
    await db.update(associationScanJobs).set({ status: "blocked", step: "blocked", completedAt: now, lastError: "Website scan stopped by robots policy.", errorClassification: "website_blocked_by_robots", updatedAt: now }).where(eq(associationScanJobs.id, job.id));
    return { status: "blocked", step: "blocked" };
  }

  await db.update(associationScanJobs).set({ step: "checking_website", updatedAt: new Date() }).where(eq(associationScanJobs.id, job.id));
  const allowedDomain = registrableDomain(normalizedUrl);
  const site = await safeFetch(websiteUrl, {
    ...safeOptions,
    validateRedirect: (redirectUrl) => {
      if (registrableDomain(redirectUrl) !== allowedDomain) throw new Error("cross_domain_redirect");
    },
  });
  if (site.status < 200 || site.status >= 400) throw new Error("website_http_error");
  const analysis = analyzeHtmlPage(site.finalUrl, site.body);
  const findings: Evidence[] = analysis.findings.map((finding) => ({ kind: finding.findingType, summary: finding.explanation, sourceUrl: finding.affectedUrl, checkedAt, confidence: finding.confidence }));
  const otherSignals = evidenceSignals(site.body, site.finalUrl, checkedAt);
  evidence.push(...findings, ...otherSignals);
  evidence.push({ kind: "https_transport", summary: site.finalUrl.startsWith("https:") ? "The inspected page loaded over HTTPS." : "The inspected page ended on HTTP without HTTPS; confirm the site's canonical URL before drawing conclusions.", sourceUrl: site.finalUrl, checkedAt, confidence: site.finalUrl.startsWith("https:") ? "high" : "medium" });
  const highSignals = analysis.findings.filter((finding) => finding.severity === "high").length;
  const mediumSignals = analysis.findings.filter((finding) => finding.severity === "medium").length;
  const distinctCategories = new Set(analysis.findings.filter((finding) => finding.severity !== "low").map((finding) => finding.category)).size;
  const websiteCondition = highSignals >= 2 || (highSignals >= 1 && mediumSignals >= 3 && distinctCategories >= 2) || (mediumSignals >= 5 && distinctCategories >= 3)
    ? "significant_problems"
    : analysis.findings.length === 0 ? "no_major_issues_detected" : "needs_manual_review";
  const contacts = extractPublicContacts(site.body, site.finalUrl);
  const robotsCaveat = evidence.some((item) => item.kind === "robots_unavailable");
  evidence.push({ kind: "automated_scope", summary: `This automated screen checked one public page. ${robotsCaveat ? "robots.txt was unavailable; manual review is recommended." : "A single-page check does not assess the entire site or confirm usability, current activity, budget, or buying intent."}`, sourceUrl: site.finalUrl, checkedAt, confidence: "low" });
  await db.update(associationProspects).set({ websiteCondition, publicContacts: contacts, evidence: evidence.slice(-100), lastCheckedAt: now, updatedAt: now }).where(eq(associationProspects.id, prospect.id));
  await db.update(associationScanJobs).set({ status: "completed", step: "complete", completedAt: now, lastError: null, errorClassification: null, updatedAt: now }).where(eq(associationScanJobs.id, job.id));
  return { status: "completed", step: "complete" };
}

export async function runAssociationProspectWorker(workerId: string) {
  const job = await claimOneJob(workerId);
  if (!job) return { claimed: 0, processed: 0 };
  try {
    const outcome = job.kind === "irs_sample"
      ? await processIrsSampleJob(job)
      : await processAssociationScanJob(job);
    return { claimed: 1, processed: 1, ...outcome };
  } catch (error) {
    const classification = safeClassification(error);
    const blocked = classification.includes("blocked") || classification.includes("safety_policy") || classification === "cross_domain_redirect" || classification === "search_not_configured";
    const status = blocked ? "blocked" : "failed";
    console.error("[association-prospect-worker] job failed", { jobId: job.id, classification });
    if (job.prospectId) await getDb().update(associationProspects).set({ websiteCondition: blocked ? "blocked" : "scan_failed", lastCheckedAt: new Date(), updatedAt: new Date() }).where(eq(associationProspects.id, job.prospectId));
    await getDb().update(associationScanJobs).set({ status, step: status, completedAt: new Date(), lastError: safeDisplay(classification), errorClassification: classification, updatedAt: new Date() }).where(eq(associationScanJobs.id, job.id));
    return { claimed: 1, processed: 1, status };
  }
}

type AssociationTransaction = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

export async function lockAssociationScanQueue(tx: AssociationTransaction) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext('association_scan_daily_limit'))`);
}

export async function queueAssociationScansInTransaction(tx: AssociationTransaction, prospectIds: string[], actor: string) {
  if (!process.env.BRAVE_SEARCH_API_KEY?.trim()) throw new Error("Website discovery is not configured.");
  const ids = [...new Set(prospectIds)].slice(0, 5);
  const prospects = await tx.select({ id: associationProspects.id }).from(associationProspects).where(inArray(associationProspects.id, ids));
  const countResult = await tx.execute<{ count: number }>(sql`select count(*)::int as count from association_scan_jobs where kind = 'website_scan' and created_at >= date_trunc('day', now())`);
  const remaining = Math.max(0, 20 - Number(countResult[0]?.count || 0));
  if (!remaining) throw new Error("Daily association website-scan limit reached. Try again tomorrow.");
  let added = 0;
  for (const prospect of prospects.slice(0, remaining)) {
    const inserted = await tx.insert(associationScanJobs).values({ prospectId: prospect.id, createdBy: actor, maxAttempts: 3 }).onConflictDoNothing().returning({ id: associationScanJobs.id });
    added += inserted.length;
  }
  if (added) await tx.execute(sql`insert into admin_activity_logs (admin_email, action, entity_type, metadata) values (${actor}, 'association_scan.queued', 'association_scan_job', ${JSON.stringify({ count: added })}::jsonb)`);
  return added;
}

export async function queueAssociationScanJobs(prospectIds: string[], actor: string) {
  if (process.env.ASSOCIATION_PROSPECTING_ENABLED !== "true") throw new Error("Association prospect scans are disabled until the admin has enabled the worker.");
  return getDb().transaction(async (tx) => {
    await lockAssociationScanQueue(tx);
    return queueAssociationScansInTransaction(tx, prospectIds, actor);
  });
}

export async function queueAssociationIrsSample(state: string, sampleLimit: number, actor: string) {
  if (process.env.ASSOCIATION_PROSPECTING_ENABLED !== "true") throw new Error("Association prospect scans are disabled until the admin has enabled the worker.");
  const normalizedState = state.trim().toUpperCase();
  if (!VALID_STATES.has(normalizedState) || ![5, 10, 25].includes(sampleLimit)) throw new Error("Choose a valid U.S. state and sample size.");
  const db = getDb();
  let jobId = "";
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('association_irs_import_daily_limit'))`);
    const counts = await tx.execute<{ count: number }>(sql`select count(*)::int as count from association_scan_jobs where kind = 'irs_sample' and created_at >= date_trunc('day', now())`);
    if (Number(counts[0]?.count || 0) >= 3) throw new Error("Daily IRS sample limit reached. Try again tomorrow.");
    const [active] = await tx.select({ id: associationScanJobs.id }).from(associationScanJobs).where(and(eq(associationScanJobs.kind, "irs_sample"), eq(associationScanJobs.sourceState, normalizedState), inArray(associationScanJobs.status, ["queued", "running"]))).limit(1);
    if (active) throw new Error("An IRS sample for that state is already queued or running.");
    const [job] = await tx.insert(associationScanJobs).values({ kind: "irs_sample", sourceState: normalizedState, sampleLimit, createdBy: actor, maxAttempts: 3 }).returning({ id: associationScanJobs.id });
    jobId = job?.id || "";
  });
  if (!jobId) throw new Error("Could not queue the IRS sample.");
  await db.execute(sql`insert into admin_activity_logs (admin_email, action, entity_type, entity_id, metadata) values (${actor}, 'association_irs.sample_queued', 'association_scan_job', ${jobId}::uuid, ${JSON.stringify({ state: normalizedState, sampleLimit })}::jsonb)`);
  return jobId;
}

export async function retryAssociationScanJob(id: string, actor: string) {
  if (process.env.ASSOCIATION_PROSPECTING_ENABLED !== "true") throw new Error("Association scans are not configured or enabled.");
  const db = getDb();
  await db.transaction(async (tx) => {
    await lockAssociationScanQueue(tx);
    const [job] = await tx.select().from(associationScanJobs).where(eq(associationScanJobs.id, id)).limit(1);
    if (!job || !["failed", "blocked"].includes(job.status)) return;
    if (job.attemptCount >= job.maxAttempts) throw new Error("This scan has reached its maximum number of attempts.");
    if (job.kind === "website_scan" && !process.env.BRAVE_SEARCH_API_KEY?.trim()) throw new Error("Website discovery is not configured.");
    await tx.update(associationScanJobs).set({ status: "queued", step: "queued", completedAt: null, workerId: null, claimedAt: null, lastError: null, errorClassification: null, updatedAt: new Date() }).where(eq(associationScanJobs.id, id));
    await tx.execute(sql`insert into admin_activity_logs (admin_email, action, entity_type, entity_id, metadata) values (${actor}, 'association_scan.requeued', 'association_scan_job', ${id}::uuid, '{}'::jsonb)`);
  });
}
