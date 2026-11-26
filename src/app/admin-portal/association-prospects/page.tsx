import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { associationProspects, associationScanJobs } from "@/lib/db/schema";
import { AssociationJobRefresh } from "@/components/admin/association-job-refresh";
import { addAssociationProspectAction, queueAssociationIrsSampleAction, queueAssociationScansAction, retryAssociationScanAction, reviewAssociationProspectAction } from "./actions";

const conditions = [
  ["unassessed", "Not assessed"],
  ["website_not_confirmed", "Website not confirmed"],
  ["no_major_issues_detected", "No major issues detected on homepage"],
  ["needs_manual_review", "Needs manual review"],
  ["significant_problems", "Potential significant problems"],
  ["scan_failed", "Scan failed"],
  ["blocked", "Blocked"],
] as const;
const conditionLabel = new Map<string, string>(conditions);
const stateCodes = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA PR RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");

function reviewCues(record: typeof associationProspects.$inferSelect) {
  const cues: string[] = [];
  if (record.websiteCondition === "significant_problems") cues.push("Several homepage signals across issue types need human confirmation.");
  if (record.websiteCondition === "needs_manual_review") cues.push("The homepage raised one or more inconclusive technical signals.");
  if (record.websiteCondition === "website_not_confirmed") cues.push("Search did not confirm an official website; this may need separate discovery.");
  if (record.publicContacts.length) cues.push(`${record.publicContacts.length} public business contact${record.publicContacts.length === 1 ? "" : "s"} found on the inspected page.`);
  if (record.evidence.some((item) => item.kind === "membership")) cues.push("Membership-related link or copy was found.");
  if (record.evidence.some((item) => item.kind === "events")) cues.push("Event or registration-related copy was found.");
  if (record.evidence.some((item) => item.kind === "online_payments")) cues.push("Online payment or dues-related copy was found.");
  if (record.organizationStatusCode) cues.push(`IRS source status ${record.organizationStatusCode}; this does not verify current operations or budget.`);
  return cues;
}

export default async function AssociationProspectsPage({ searchParams }: { searchParams: Promise<{ q?: string; state?: string; classification?: string; condition?: string; review?: string }> }) {
  const admin = await requireAdmin();
  const prospectingEnabled = process.env.ASSOCIATION_PROSPECTING_ENABLED === "true";
  const scanningEnabled = prospectingEnabled && Boolean(process.env.BRAVE_SEARCH_API_KEY?.trim());
  const params = await searchParams;
  let records: typeof associationProspects.$inferSelect[] = [];
  let latestJobs = new Map<string, typeof associationScanJobs.$inferSelect>();
  let recentJobs: typeof associationScanJobs.$inferSelect[] = [];
  let totals = { total: 0, assessed: 0, notConfirmed: 0, healthy: 0, manual: 0, problems: 0, unassessed: 0, failed: 0, blocked: 0 };
  let loadError = false;
  try {
    const db = getDb();
    const filters = [];
    if (params.q?.trim()) filters.push(ilike(associationProspects.name, `%${params.q.trim().slice(0, 80)}%`));
    if (params.state && /^[A-Z]{2}$/.test(params.state.toUpperCase())) filters.push(eq(associationProspects.state, params.state.toUpperCase()));
    if (params.classification?.trim()) filters.push(eq(associationProspects.classificationCode, params.classification.trim().slice(0, 4).toUpperCase()));
    if (params.condition && conditions.some(([value]) => value === params.condition)) filters.push(eq(associationProspects.websiteCondition, params.condition as typeof associationProspects.$inferSelect.websiteCondition));
    if (params.review && ["needs_review", "confirmed", "rejected"].includes(params.review)) filters.push(eq(associationProspects.reviewStatus, params.review as typeof associationProspects.$inferSelect.reviewStatus));
    const where = filters.length ? and(...filters) : undefined;
    const [rows, [stats]] = await Promise.all([
      db.select().from(associationProspects).where(where).orderBy(desc(associationProspects.updatedAt)).limit(100),
      db.select({
        total: sql<number>`count(*)::int`,
        assessed: sql<number>`count(*) filter (where website_condition in ('website_not_confirmed','no_major_issues_detected','needs_manual_review','significant_problems'))::int`,
        notConfirmed: sql<number>`count(*) filter (where website_condition = 'website_not_confirmed')::int`,
        healthy: sql<number>`count(*) filter (where website_condition = 'no_major_issues_detected')::int`,
        manual: sql<number>`count(*) filter (where website_condition = 'needs_manual_review')::int`,
        problems: sql<number>`count(*) filter (where website_condition = 'significant_problems')::int`,
        unassessed: sql<number>`count(*) filter (where website_condition = 'unassessed')::int`,
        failed: sql<number>`count(*) filter (where website_condition = 'scan_failed')::int`,
        blocked: sql<number>`count(*) filter (where website_condition = 'blocked')::int`,
      }).from(associationProspects),
    ]);
    records = rows;
    recentJobs = await db.select().from(associationScanJobs).orderBy(desc(associationScanJobs.createdAt)).limit(15);
    if (rows.length) {
      const jobs = await db.select().from(associationScanJobs).where(inArray(associationScanJobs.prospectId, rows.map((row) => row.id))).orderBy(desc(associationScanJobs.createdAt));
      latestJobs = new Map();
      for (const job of jobs) if (job.prospectId && !latestJobs.has(job.prospectId)) latestJobs.set(job.prospectId, job);
    }
    totals = { total: Number(stats?.total || 0), assessed: Number(stats?.assessed || 0), notConfirmed: Number(stats?.notConfirmed || 0), healthy: Number(stats?.healthy || 0), manual: Number(stats?.manual || 0), problems: Number(stats?.problems || 0), unassessed: Number(stats?.unassessed || 0), failed: Number(stats?.failed || 0), blocked: Number(stats?.blocked || 0) };
  } catch { loadError = true; }

  return <AdminShell email={admin.email}>
    <header className="admin-heading"><div><p className="eyebrow">Private research workspace</p><h1>Association prospects</h1><p>Build a reviewable list of U.S. associations and understand what the available website evidence does and does not show.</p></div></header>
    <section className="association-prospect-stats" aria-label="Saved prospect summary">
      <article className="admin-card"><span>Saved prospects</span><strong>{totals.total}</strong><small>Records saved in this workspace</small></article>
      <article className="admin-card"><span>Website assessed</span><strong>{totals.assessed}</strong><small>Denominator for the percentages below</small></article>
      <article className="admin-card"><span>Website not confirmed</span><strong>{totals.assessed ? `${Math.round(totals.notConfirmed / totals.assessed * 100)}%` : "—"}</strong><small>{totals.notConfirmed} of {totals.assessed} assessed</small></article>
      <article className="admin-card"><span>Potential significant problems</span><strong>{totals.assessed ? `${Math.round(totals.problems / totals.assessed * 100)}%` : "—"}</strong><small>{totals.problems} of {totals.assessed} assessed</small></article>
    </section>
    <p className="notice">Report scope: all saved records; the search filters affect the list only. Category percentages use the completed-assessment denominator ({totals.assessed}). Unassessed, blocked, and failed records are excluded. “Website not confirmed” does not mean the organization has no website. A technical finding alone does not establish activity, budget, or buying intent.</p>
    <section className="admin-card association-condition-report"><div className="card-heading"><div><p className="eyebrow">Website condition breakdown</p><h2>Counts and percentages</h2></div><span className="field-help">Denominator: {totals.assessed} assessed</span></div>
      <div className="table-wrap"><table><thead><tr><th>Category</th><th>Count</th><th>Percent of assessed</th></tr></thead><tbody>
        {[ ["Website not confirmed", totals.notConfirmed], ["No major issues detected on the homepage", totals.healthy], ["Needs manual review", totals.manual], ["Potential significant problems", totals.problems] ].map(([label, count]) => <tr key={label}><td>{label}</td><td>{count}</td><td>{totals.assessed ? `${Math.round(Number(count) / totals.assessed * 100)}%` : "—"}</td></tr>)}
        <tr><td>Not assessed</td><td>{totals.unassessed}</td><td>Excluded</td></tr><tr><td>Scan failed</td><td>{totals.failed}</td><td>Excluded</td></tr><tr><td>Blocked</td><td>{totals.blocked}</td><td>Excluded</td></tr>
      </tbody></table></div>
    </section>
    {loadError && <p className="notice notice-error">Prospect data is unavailable. Check the database connection and apply the association-prospect migration before using this workspace.</p>}
    <section className="admin-card association-prospect-intro"><div><p className="eyebrow">Small, bounded scans</p><h2>Start with a small IRS sample</h2><p>The workspace keeps association records separate from leads and outreach. A state sample is drawn randomly from the IRS file, then each website check runs through the background worker. Website matches always remain marked for your review.</p>
      <form action={queueAssociationIrsSampleAction} className="association-source-form">
        <label>State<select name="state" defaultValue="IL">{stateCodes.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>
        <label>Sample size<select name="sampleLimit" defaultValue="5"><option value="5">5 organizations</option><option value="10">10 organizations</option><option value="25">25 organizations</option></select></label>
        <button className="button button-primary" disabled={!prospectingEnabled}>Queue IRS sample</button>
      </form>
      <p className="field-help">The IRS source is filtered to subsection 06 and status codes 01 or 02. It reflects filing-address state, may omit some associations, and is not a census of all U.S. associations. IRS exemption status does not prove current operations, budget, or buying intent. Up to three state imports per day.</p>
    </div>
      {!prospectingEnabled && <p className="notice">The private workspace is being prepared. The source and scan worker switch is not enabled yet.</p>}
      {prospectingEnabled && !scanningEnabled && <p className="notice">IRS source samples can be queued. Website discovery remains disabled until the server-side Brave API key is configured.</p>}
      <details><summary>Add an association record</summary><form action={addAssociationProspectAction} className="admin-form association-prospect-form">
        <label>EIN (nine digits)<input name="ein" inputMode="numeric" pattern="[0-9]{9}" required maxLength={9} placeholder="123456789" /></label>
        <label>Organization name<input name="name" required maxLength={200} /></label>
        <label>City<input name="city" maxLength={120} /></label>
        <label>State<input name="state" maxLength={2} placeholder="IL" /></label>
        <label>Website URL, if confirmed<input name="websiteUrl" type="url" placeholder="https://example.org" /></label>
        <label>Source record URL<input name="sourceUrl" type="url" placeholder="https://www.irs.gov/…" /></label>
        <button className="button button-primary" disabled={!prospectingEnabled}>Save prospect</button>
      </form></details>
    </section>
    {recentJobs.length > 0 && <section className="admin-card association-recent-jobs"><div className="card-heading"><div><p className="eyebrow">Background work</p><h2>Recent imports and scans</h2></div><span className="status-pill">Latest {recentJobs.length}</span></div>
      <AssociationJobRefresh active={recentJobs.some((job) => ["queued", "running"].includes(job.status))} />
      <div className="table-wrap"><table><thead><tr><th>Work item</th><th>Status</th><th>Progress</th><th>Result</th><th>Action</th></tr></thead><tbody>{recentJobs.map((job) => <tr key={job.id}>
        <td>{job.kind === "irs_sample" ? `IRS ${job.sourceState} sample (${job.sampleLimit})` : records.find((record) => record.id === job.prospectId)?.name || "Website scan"}</td>
        <td>{job.status.replaceAll("_", " ")}</td><td>{job.step.replaceAll("_", " ")}</td>
        <td>{job.kind === "irs_sample" ? job.status === "completed" ? `${Math.min(job.sampleLimit ?? 0, job.sourcePopulationCount ?? 0)} sampled · ${job.sourceImportedCount ?? 0} new EINs saved · ${job.sourcePopulationCount ?? 0} eligible in filtered file` : `${job.sourcePopulationCount ?? 0} eligible records seen so far` : job.lastError || (job.status === "completed" ? "Homepage checked; evidence saved" : "")}</td>
        <td>{["failed", "blocked"].includes(job.status) && (job.attemptCount < job.maxAttempts ? <form action={retryAssociationScanAction}><input type="hidden" name="jobId" value={job.id} /><button className="button button-secondary" disabled={!prospectingEnabled || (job.kind === "website_scan" && !scanningEnabled)}>Retry</button></form> : <span className="field-help">Attempt limit reached</span>)}</td>
      </tr>)}</tbody></table></div>
    </section>}
    <section className="admin-card">
      <div className="card-heading"><div><p className="eyebrow">Saved records</p><h2>Review association prospects</h2></div><div className="button-row"><a className="button button-secondary" href="/admin-portal/association-prospects/export">Export CSV</a><span className="status-pill">{totals.total} total</span></div></div>
      <form method="get" className="filter-bar association-prospect-filter">
        <label>Organization<input name="q" defaultValue={params.q} placeholder="Search name" /></label>
        <label>State<input name="state" defaultValue={params.state} maxLength={2} placeholder="Any" /></label>
        <label>IRS classification<input name="classification" defaultValue={params.classification} maxLength={4} placeholder="Any" /></label>
        <label>Website condition<select name="condition" defaultValue={params.condition || ""}><option value="">Any condition</option>{conditions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Review status<select name="review" defaultValue={params.review || ""}><option value="">Any status</option><option value="needs_review">Needs review</option><option value="confirmed">Confirmed</option><option value="rejected">Rejected</option></select></label>
        <button className="button button-secondary">Filter</button>
      </form>
      {!records.length ? <div className="empty-state"><h3>No prospects in this view</h3><p>Start with a small set of organizations and preserve the source links used to identify them.</p></div> : <div className="association-prospect-list">{records.map((record) => <article className="association-prospect-card" key={record.id}>
        <div className="association-prospect-summary"><div><h3>{record.name}</h3><p>{[record.city, record.state].filter(Boolean).join(", ") || "Location not available"} · EIN {record.ein}{record.classificationCode ? ` · IRS class ${record.classificationCode}` : ""}{record.organizationStatusCode ? ` · IRS status ${record.organizationStatusCode}` : ""}</p></div><span className="status-pill">{conditionLabel.get(record.websiteCondition)}</span></div>
        {record.websiteUrl && <p><a href={record.websiteUrl} target="_blank" rel="noreferrer">{record.websiteUrl}</a></p>}
        <p className="field-help">Review: {record.reviewStatus.replaceAll("_", " ")} · Last checked: {record.lastCheckedAt?.toLocaleDateString("en-US") || "not checked"}</p>
        {record.sourceUrl && <p className="field-help">Source: <a href={record.sourceUrl} target="_blank" rel="noreferrer">View source record</a>{record.sourceCheckedAt ? ` · imported ${record.sourceCheckedAt.toLocaleDateString("en-US")}` : ""}</p>}
        <p className="field-help"><strong>Review cues (not a lead score):</strong> {reviewCues(record).join(" ") || "No evidence-based priority cue has been recorded yet."}</p>
        {(record.publicContacts.length > 0 || record.evidence.length > 0) && <details className="association-evidence"><summary>Public contacts and supporting evidence ({record.publicContacts.length} contacts, {record.evidence.length} notes)</summary>
          {record.publicContacts.length > 0 && <div><h4>Public business contacts</h4><ul>{record.publicContacts.map((contact, index) => <li key={`${contact.type}-${contact.value}-${index}`}><span>{contact.type === "email" ? "Email" : "Phone"}: </span><a href={`${contact.type === "email" ? "mailto:" : "tel:"}${contact.value}`}>{contact.value}</a> · <a href={contact.sourceUrl} target="_blank" rel="noreferrer">Source page</a></li>)}</ul></div>}
          {record.evidence.length > 0 && <div><h4>Evidence</h4><ul>{record.evidence.map((item, index) => <li key={`${item.kind}-${index}`}><strong>{item.kind.replaceAll("_", " ")}</strong><span> — {item.summary}</span>{item.confidence && <small> · {item.confidence} confidence</small>}{item.checkedAt && <small> · {new Date(item.checkedAt).toLocaleDateString("en-US")}</small>}{item.sourceUrl && <> · <a href={item.sourceUrl} target="_blank" rel="noreferrer">Evidence source</a></>}</li>)}</ul></div>}
        </details>}
        {(() => { const job = latestJobs.get(record.id); return <div className="association-scan-controls">
          {job && <span className={`status-pill association-job-${job.status}`}>Scan {job.status.replaceAll("_", " ")}{job.status === "running" ? ` · ${job.step.replaceAll("_", " ")}` : ""}</span>}
          {job?.lastError && <span className="field-help">{job.lastError}</span>}
          {job && ["queued", "running"].includes(job.status) ? null : job && ["failed", "blocked"].includes(job.status) ? job.attemptCount < job.maxAttempts ? <form action={retryAssociationScanAction}><input type="hidden" name="jobId" value={job.id} /><button className="button button-secondary" disabled={!scanningEnabled}>Retry scan</button></form> : <span className="field-help">Attempt limit reached</span> : <form action={queueAssociationScansAction}><input type="hidden" name="prospectId" value={record.id} /><button className="button button-secondary" disabled={!scanningEnabled}>Queue website scan</button></form>}
        </div>; })()}
        <details><summary>Review record</summary><form action={reviewAssociationProspectAction} className="admin-form association-prospect-form">
          <input type="hidden" name="id" value={record.id} />
          <label>Website URL<input name="websiteUrl" type="url" defaultValue={record.websiteUrl || ""} /></label>
          <label>Condition<select name="websiteCondition" defaultValue={record.websiteCondition}>{conditions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Review<select name="reviewStatus" defaultValue={record.reviewStatus}><option value="needs_review">Needs review</option><option value="confirmed">Confirmed</option><option value="rejected">Rejected</option></select></label>
          <label className="span-two">Review note<textarea name="reviewNote" rows={3} maxLength={1000} defaultValue={record.reviewNote || ""} /></label>
          <button className="button button-secondary" disabled={!prospectingEnabled}>Save review</button>
        </form></details>
      </article>)}</div>}
    </section>
  </AdminShell>;
}
