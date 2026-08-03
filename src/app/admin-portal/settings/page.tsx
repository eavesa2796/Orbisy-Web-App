import { CheckCircle2, CircleDashed } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { hasDatabaseConfig, hasSupabaseConfig } from "@/lib/config";
import { getImportSettings } from "@/lib/imports/service";
import { updateSettingsAction } from "@/app/admin-portal/settings/actions";

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const settings = await getImportSettings();
  const items = [
    ["PostgreSQL", hasDatabaseConfig(), "Required for forms, leads, and analytics"],
    ["Supabase authentication", hasSupabaseConfig(), "Required for administrator sign-in"],
    ["Administrator allowlist", Boolean(process.env.ADMIN_EMAIL), "Must match the sole Supabase administrator"],
    ["Turnstile spam protection", Boolean(process.env.TURNSTILE_SECRET_KEY), "Required before production form launch"],
    ["Inbound notifications", Boolean(process.env.RESEND_API_KEY), "Optional; form storage works without email"],
    ["Preflight worker secret", Boolean(process.env.PREFLIGHT_WORKER_SECRET), "Required before worker execution"],
    ["Deep-audit worker secret", Boolean(process.env.DEEP_AUDIT_WORKER_SECRET), "Required only for the separate Phase 4 worker"],
    ["PageSpeed", Boolean(process.env.PAGESPEED_API_KEY), "Optional; unavailable checks do not count as failures"],
  ] as const;

  return (
    <AdminShell email={admin.email}>
      <header className="admin-heading"><div><p className="eyebrow">Configuration</p><h1>Settings</h1></div></header>
      <section className="admin-grid">
        <article className="admin-card"><h2>Launch readiness</h2><ul className="check-list">{items.map(([label, ready, detail]) => <li key={label}>{ready ? <CheckCircle2 className="ready" /> : <CircleDashed />}<div><strong>{label}</strong><span>{detail}</span></div><b>{ready ? "Configured" : "Required"}</b></li>)}</ul><p className="muted">Secret values are never displayed here.</p></article>
        <article className="admin-card"><h2>Initial market focus</h2><dl className="detail-list"><div><dt>Locations</dt><dd>{settings.targetLocations.join(", ")}</dd></div><div><dt>Industries</dt><dd>{settings.targetIndustries.join(", ")}</dd></div></dl></article>
        <article className="admin-card"><h2>Outreach policy</h2><p>Draft preparation and manual contact logging only. No email-send integration, sequences, bulk outreach, or automatic delivery exist in Phase Two.</p></article>
        <article className="admin-card"><h2>Analytics policy</h2><p>First-party aggregate events, 90-day maximum reporting window, Global Privacy Control and Do Not Track honored, and no session replay or identity profiles.</p></article>
      </section>
      <section className="admin-card">
        <div className="card-heading"><div><p className="eyebrow">Stored in PostgreSQL</p><h2>Lead import controls</h2></div></div>
        <form action={updateSettingsAction} className="admin-form settings-form">
          <label>Target industries, one per line<textarea name="targetIndustries" rows={5} defaultValue={settings.targetIndustries.join("\n")} required /></label>
          <label>Target locations, one per line<textarea name="targetLocations" rows={5} defaultValue={settings.targetLocations.join("\n")} required /></label>
          <label>Maximum CSV bytes<input name="maxCsvBytes" type="number" min={100000} max={5000000} defaultValue={settings.maxCsvBytes} required /></label>
          <label>Maximum rows per batch<input name="maxRowsPerBatch" type="number" min={10} max={2000} defaultValue={settings.maxRowsPerBatch} required /></label>
          <label>Default source name<input name="defaultSourceName" defaultValue={settings.defaultSourceName} required /></label>
          <label>Default leads per page<input name="defaultPageSize" type="number" min={10} max={100} defaultValue={settings.defaultPageSize} required /></label>
          <label>Likely duplicate threshold<input name="likelyDuplicateThreshold" type="number" min={75} max={100} defaultValue={settings.likelyDuplicateThreshold} required /></label>
          <label>Possible duplicate threshold<input name="possibleDuplicateThreshold" type="number" min={40} max={90} defaultValue={settings.possibleDuplicateThreshold} required /></label>
          <label>Import retention days<input name="importRetentionDays" type="number" min={30} max={2555} defaultValue={settings.importRetentionDays} required /></label>
          <label className="checkbox"><input name="possibleDuplicatesRequireReview" type="checkbox" defaultChecked={settings.possibleDuplicatesRequireReview} /> Require review for possible duplicates</label>
          <label className="checkbox"><input name="missingWebsitesRequireReview" type="checkbox" defaultChecked={settings.missingWebsitesRequireReview} /> Require review when no website is listed</label>
          <h3>Preflight operating controls</h3>
          <label className="checkbox"><input name="preflightEnabled" type="checkbox" defaultChecked={settings.preflightEnabled} /> Global preflight/audit kill switch enabled</label>
          <label className="checkbox"><input name="workerEnabled" type="checkbox" defaultChecked={settings.workerEnabled} /> Worker enabled</label>
          <label>Maximum jobs per day<input name="maxPreflightJobsPerDay" type="number" min={1} max={1000} defaultValue={settings.maxPreflightJobsPerDay}/></label>
          <label>Jobs per worker run<input name="maxJobsPerWorkerRun" type="number" min={1} max={25} defaultValue={settings.maxJobsPerWorkerRun}/></label>
          <label>Maximum concurrent jobs<input name="maxConcurrentJobs" type="number" min={1} max={10} defaultValue={settings.maxConcurrentJobs}/></label>
          <label>Per-domain delay (ms)<input name="perDomainDelayMs" type="number" min={500} max={60000} defaultValue={settings.perDomainDelayMs}/></label>
          <label>DNS timeout (ms)<input name="dnsTimeoutMs" type="number" min={500} max={15000} defaultValue={settings.dnsTimeoutMs}/></label>
          <label>Connection timeout (ms)<input name="connectionTimeoutMs" type="number" min={1000} max={30000} defaultValue={settings.connectionTimeoutMs}/></label>
          <label>Overall request timeout (ms)<input name="overallRequestTimeoutMs" type="number" min={2000} max={60000} defaultValue={settings.overallRequestTimeoutMs}/></label>
          <label>Maximum redirects<input name="maxRedirects" type="number" min={0} max={10} defaultValue={settings.maxRedirects}/></label>
          <label>Maximum response bytes<input name="maxResponseBytes" type="number" min={50000} max={5000000} defaultValue={settings.maxResponseBytes}/></label>
          <label>Retry limit<input name="preflightRetryLimit" type="number" min={1} max={5} defaultValue={settings.preflightRetryLimit}/></label>
          <label>Retry backoff seconds<input name="retryBackoffSeconds" type="number" min={10} max={86400} defaultValue={settings.retryBackoffSeconds}/></label>
          <label>Recheck interval days<input name="preflightRecheckDays" type="number" min={1} max={365} defaultValue={settings.preflightRecheckDays}/></label>
          <label>Minimum Business Fit Score<input name="minimumBusinessFitScore" type="number" min={0} max={100} defaultValue={settings.minimumBusinessFitScore}/></label>
          <label className="checkbox"><input name="requireTargetIndustry" type="checkbox" defaultChecked={settings.requireTargetIndustry}/> Require target-industry match</label>
          <label className="checkbox"><input name="requireTargetLocation" type="checkbox" defaultChecked={settings.requireTargetLocation}/> Require target-location match</label>
          <label>Fetcher user agent<input name="fetcherUserAgent" minLength={20} maxLength={255} defaultValue={settings.fetcherUserAgent}/></label>
          <h3>Deep-audit operating controls</h3>
          <label className="checkbox"><input name="deepAuditEnabled" type="checkbox" defaultChecked={settings.deepAuditEnabled}/> Deep-audit global switch enabled</label>
          <label className="checkbox"><input name="deepAuditWorkerEnabled" type="checkbox" defaultChecked={settings.deepAuditWorkerEnabled}/> Deep-audit worker enabled</label>
          <label className="checkbox"><input name="pageSpeedEnabled" type="checkbox" defaultChecked={settings.pageSpeedEnabled}/> PageSpeed integration enabled</label>
          <label>Maximum audits per day<input name="maxAuditsPerDay" type="number" min={1} max={100} defaultValue={settings.maxAuditsPerDay}/></label>
          <label>Jobs per worker invocation<input name="maxAuditJobsPerWorkerRun" type="number" min={1} max={5} defaultValue={settings.maxAuditJobsPerWorkerRun}/></label>
          <label>Maximum concurrent audits<input name="maxConcurrentAudits" type="number" min={1} max={3} defaultValue={settings.maxConcurrentAudits}/></label>
          <label>Maximum pages per website<input name="maxPagesPerAudit" type="number" min={1} max={5} defaultValue={settings.maxPagesPerAudit}/></label>
          <label>Maximum internal links checked<input name="maxInternalLinksChecked" type="number" min={0} max={50} defaultValue={settings.maxInternalLinksChecked}/></label>
          <label>Per-domain delay (ms)<input name="auditPerDomainDelayMs" type="number" min={500} max={60000} defaultValue={settings.auditPerDomainDelayMs}/></label>
          <label>DNS timeout (ms)<input name="auditDnsTimeoutMs" type="number" min={500} max={15000} defaultValue={settings.auditDnsTimeoutMs}/></label>
          <label>Connection timeout (ms)<input name="auditConnectionTimeoutMs" type="number" min={1000} max={30000} defaultValue={settings.auditConnectionTimeoutMs}/></label>
          <label>Page timeout (ms)<input name="auditPageTimeoutMs" type="number" min={2000} max={60000} defaultValue={settings.auditPageTimeoutMs}/></label>
          <label>Overall audit timeout (ms)<input name="overallAuditTimeoutMs" type="number" min={5000} max={180000} defaultValue={settings.overallAuditTimeoutMs}/></label>
          <label>Maximum redirects<input name="auditMaxRedirects" type="number" min={0} max={10} defaultValue={settings.auditMaxRedirects}/></label>
          <label>Maximum bytes per page<input name="maxResponseBytesPerPage" type="number" min={50000} max={2000000} defaultValue={settings.maxResponseBytesPerPage}/></label>
          <label>Maximum bytes per audit<input name="maxTotalBytesPerAudit" type="number" min={100000} max={8000000} defaultValue={settings.maxTotalBytesPerAudit}/></label>
          <label>Retry limit<input name="auditRetryLimit" type="number" min={1} max={5} defaultValue={settings.auditRetryLimit}/></label>
          <label>Retry backoff seconds<input name="auditRetryBackoffSeconds" type="number" min={10} max={86400} defaultValue={settings.auditRetryBackoffSeconds}/></label>
          <label>Re-audit interval days<input name="reauditIntervalDays" type="number" min={1} max={730} defaultValue={settings.reauditIntervalDays}/></label>
          <label>Minimum Business Fit Score<input name="auditMinimumBusinessFitScore" type="number" min={0} max={100} defaultValue={settings.auditMinimumBusinessFitScore}/></label>
          <label>Minimum Audit Confidence<select name="minimumAuditConfidence" defaultValue={settings.minimumAuditConfidence}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
          <label>Retention days (0 keeps history indefinitely)<input name="auditRetentionDays" type="number" min={0} max={2555} defaultValue={settings.auditRetentionDays}/></label>
          <button className="button button-primary" type="submit">Save settings</button>
        </form>
      </section>
    </AdminShell>
  );
}
