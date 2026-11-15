import { updateSettingsAction } from "@/app/admin-portal/settings/actions";
import { adminSettingHelp } from "@/lib/admin-setting-help";
import type { getImportSettings } from "@/lib/imports/service";
export function OperatingSettingsForm({
  settings,
  readOnly = false,
}: {
  settings: Awaited<ReturnType<typeof getImportSettings>>;
  readOnly?: boolean;
}) {
  return (
    <form action={updateSettingsAction} className="operating-settings-form">
      <fieldset disabled={readOnly} className="settings-controls">
        <legend className="sr-only">Operating settings</legend>
        <details className="admin-card settings-group" open>
          <summary>Targets & import basics</summary>
          <p className="settings-group-intro">
            Review legacy local rules before using them for association
            research.
          </p>
          <div className="admin-form settings-form">
            <div className="settings-field">
              <label>
                Target industries, one per line
                <textarea
                  id="setting-targetIndustries"
                  aria-describedby="setting-help-targetIndustries"
                  name="targetIndustries"
                  rows={5}
                  defaultValue={settings.targetIndustries.join("\n")}
                  required
                />
              </label>
              <p id="setting-help-targetIndustries" className="field-help">
                {adminSettingHelp.targetIndustries}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Target locations, one per line
                <textarea
                  id="setting-targetLocations"
                  aria-describedby="setting-help-targetLocations"
                  name="targetLocations"
                  rows={5}
                  defaultValue={settings.targetLocations.join("\n")}
                  required
                />
              </label>
              <p id="setting-help-targetLocations" className="field-help">
                {adminSettingHelp.targetLocations}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Default source name
                <input
                  id="setting-defaultSourceName"
                  aria-describedby="setting-help-defaultSourceName"
                  name="defaultSourceName"
                  defaultValue={settings.defaultSourceName}
                  required
                />
              </label>
              <p id="setting-help-defaultSourceName" className="field-help">
                {adminSettingHelp.defaultSourceName}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Maximum CSV bytes
                <input
                  id="setting-maxCsvBytes"
                  aria-describedby="setting-help-maxCsvBytes"
                  name="maxCsvBytes"
                  type="number"
                  min={100000}
                  max={5000000}
                  defaultValue={settings.maxCsvBytes}
                  required
                />
              </label>
              <p id="setting-help-maxCsvBytes" className="field-help">
                {adminSettingHelp.maxCsvBytes}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Maximum rows per batch
                <input
                  id="setting-maxRowsPerBatch"
                  aria-describedby="setting-help-maxRowsPerBatch"
                  name="maxRowsPerBatch"
                  type="number"
                  min={10}
                  max={2000}
                  defaultValue={settings.maxRowsPerBatch}
                  required
                />
              </label>
              <p id="setting-help-maxRowsPerBatch" className="field-help">
                {adminSettingHelp.maxRowsPerBatch}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Default leads per page
                <input
                  id="setting-defaultPageSize"
                  aria-describedby="setting-help-defaultPageSize"
                  name="defaultPageSize"
                  type="number"
                  min={10}
                  max={100}
                  defaultValue={settings.defaultPageSize}
                  required
                />
              </label>
              <p id="setting-help-defaultPageSize" className="field-help">
                {adminSettingHelp.defaultPageSize}
              </p>
            </div>
          </div>
        </details>
        <details className="admin-card settings-group">
          <summary>Duplicate review & import history</summary>
          <p className="settings-group-intro">
            Adjust future import matching deliberately. Retention is stored but
            does not run automatic deletion.
          </p>
          <div className="admin-form settings-form">
            <div className="settings-field">
              <label>
                Likely duplicate threshold (reserved)
                <input
                  id="setting-likelyDuplicateThreshold"
                  aria-describedby="setting-help-likelyDuplicateThreshold"
                  name="likelyDuplicateThreshold"
                  type="number"
                  min={75}
                  max={100}
                  defaultValue={settings.likelyDuplicateThreshold}
                  required
                />
              </label>
              <p
                id="setting-help-likelyDuplicateThreshold"
                className="field-help"
              >
                {adminSettingHelp.likelyDuplicateThreshold}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Possible duplicate threshold (reserved)
                <input
                  id="setting-possibleDuplicateThreshold"
                  aria-describedby="setting-help-possibleDuplicateThreshold"
                  name="possibleDuplicateThreshold"
                  type="number"
                  min={40}
                  max={90}
                  defaultValue={settings.possibleDuplicateThreshold}
                  required
                />
              </label>
              <p
                id="setting-help-possibleDuplicateThreshold"
                className="field-help"
              >
                {adminSettingHelp.possibleDuplicateThreshold}
              </p>
            </div>
            <div className="settings-field">
              <label className="checkbox">
                <input
                  id="setting-possibleDuplicatesRequireReview"
                  aria-describedby="setting-help-possibleDuplicatesRequireReview"
                  name="possibleDuplicatesRequireReview"
                  type="checkbox"
                  defaultChecked={settings.possibleDuplicatesRequireReview}
                />{" "}
                Require review for possible duplicates
              </label>
              <p
                id="setting-help-possibleDuplicatesRequireReview"
                className="field-help"
              >
                {adminSettingHelp.possibleDuplicatesRequireReview}
              </p>
            </div>
            <div className="settings-field">
              <label className="checkbox">
                <input
                  id="setting-missingWebsitesRequireReview"
                  aria-describedby="setting-help-missingWebsitesRequireReview"
                  name="missingWebsitesRequireReview"
                  type="checkbox"
                  defaultChecked={settings.missingWebsitesRequireReview}
                />{" "}
                Require review when no website is listed
              </label>
              <p
                id="setting-help-missingWebsitesRequireReview"
                className="field-help"
              >
                {adminSettingHelp.missingWebsitesRequireReview}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Import retention days
                <input
                  id="setting-importRetentionDays"
                  aria-describedby="setting-help-importRetentionDays"
                  name="importRetentionDays"
                  type="number"
                  min={30}
                  max={2555}
                  defaultValue={settings.importRetentionDays}
                  required
                />
              </label>
              <p id="setting-help-importRetentionDays" className="field-help">
                {adminSettingHelp.importRetentionDays}
              </p>
            </div>
          </div>
        </details>
        <details className="admin-card settings-group">
          <summary>Website checks: permissions & fit</summary>
          <p className="settings-group-intro">
            Allowing processing is separate from scheduling a worker. These
            controls do not enable deep audits.
          </p>
          <div className="admin-form settings-form">
            <div className="settings-field">
              <label className="checkbox">
                <input
                  id="setting-preflightEnabled"
                  aria-describedby="setting-help-preflightEnabled"
                  name="preflightEnabled"
                  type="checkbox"
                  defaultChecked={settings.preflightEnabled}
                />{" "}
                Allow website checks (preflight)
              </label>
              <p id="setting-help-preflightEnabled" className="field-help">
                {adminSettingHelp.preflightEnabled}
              </p>
            </div>
            <div className="settings-field">
              <label className="checkbox">
                <input
                  id="setting-workerEnabled"
                  aria-describedby="setting-help-workerEnabled"
                  name="workerEnabled"
                  type="checkbox"
                  defaultChecked={settings.workerEnabled}
                />{" "}
                Allow preflight worker processing
              </label>
              <p id="setting-help-workerEnabled" className="field-help">
                {adminSettingHelp.workerEnabled}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Minimum Business Fit Score
                <input
                  id="setting-minimumBusinessFitScore"
                  aria-describedby="setting-help-minimumBusinessFitScore"
                  name="minimumBusinessFitScore"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={settings.minimumBusinessFitScore}
                />
              </label>
              <p
                id="setting-help-minimumBusinessFitScore"
                className="field-help"
              >
                {adminSettingHelp.minimumBusinessFitScore}
              </p>
            </div>
            <div className="settings-field">
              <label className="checkbox">
                <input
                  id="setting-requireTargetIndustry"
                  aria-describedby="setting-help-requireTargetIndustry"
                  name="requireTargetIndustry"
                  type="checkbox"
                  defaultChecked={settings.requireTargetIndustry}
                />{" "}
                Require target-industry match
              </label>
              <p id="setting-help-requireTargetIndustry" className="field-help">
                {adminSettingHelp.requireTargetIndustry}
              </p>
            </div>
            <div className="settings-field">
              <label className="checkbox">
                <input
                  id="setting-requireTargetLocation"
                  aria-describedby="setting-help-requireTargetLocation"
                  name="requireTargetLocation"
                  type="checkbox"
                  defaultChecked={settings.requireTargetLocation}
                />{" "}
                Require target-location match
              </label>
              <p id="setting-help-requireTargetLocation" className="field-help">
                {adminSettingHelp.requireTargetLocation}
              </p>
            </div>
          </div>
        </details>
        <details className="admin-card settings-group">
          <summary>Website checks: technical limits</summary>
          <p className="settings-group-intro">
            Advanced. Keep current limits unless diagnosing a specific check or
            worker problem.
          </p>
          <div className="admin-form settings-form">
            <div className="settings-field">
              <label>
                Maximum jobs per day
                <input
                  id="setting-maxPreflightJobsPerDay"
                  aria-describedby="setting-help-maxPreflightJobsPerDay"
                  name="maxPreflightJobsPerDay"
                  type="number"
                  min={1}
                  max={1000}
                  defaultValue={settings.maxPreflightJobsPerDay}
                />
              </label>
              <p
                id="setting-help-maxPreflightJobsPerDay"
                className="field-help"
              >
                {adminSettingHelp.maxPreflightJobsPerDay}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Jobs per worker run
                <input
                  id="setting-maxJobsPerWorkerRun"
                  aria-describedby="setting-help-maxJobsPerWorkerRun"
                  name="maxJobsPerWorkerRun"
                  type="number"
                  min={1}
                  max={25}
                  defaultValue={settings.maxJobsPerWorkerRun}
                />
              </label>
              <p id="setting-help-maxJobsPerWorkerRun" className="field-help">
                {adminSettingHelp.maxJobsPerWorkerRun}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Maximum concurrent jobs
                <input
                  id="setting-maxConcurrentJobs"
                  aria-describedby="setting-help-maxConcurrentJobs"
                  name="maxConcurrentJobs"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={settings.maxConcurrentJobs}
                />
              </label>
              <p id="setting-help-maxConcurrentJobs" className="field-help">
                {adminSettingHelp.maxConcurrentJobs}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Per-domain delay (ms)
                <input
                  id="setting-perDomainDelayMs"
                  aria-describedby="setting-help-perDomainDelayMs"
                  name="perDomainDelayMs"
                  type="number"
                  min={500}
                  max={60000}
                  defaultValue={settings.perDomainDelayMs}
                />
              </label>
              <p id="setting-help-perDomainDelayMs" className="field-help">
                {adminSettingHelp.perDomainDelayMs}
              </p>
            </div>
            <div className="settings-field">
              <label>
                DNS timeout (ms)
                <input
                  id="setting-dnsTimeoutMs"
                  aria-describedby="setting-help-dnsTimeoutMs"
                  name="dnsTimeoutMs"
                  type="number"
                  min={500}
                  max={15000}
                  defaultValue={settings.dnsTimeoutMs}
                />
              </label>
              <p id="setting-help-dnsTimeoutMs" className="field-help">
                {adminSettingHelp.dnsTimeoutMs}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Connection timeout (ms)
                <input
                  id="setting-connectionTimeoutMs"
                  aria-describedby="setting-help-connectionTimeoutMs"
                  name="connectionTimeoutMs"
                  type="number"
                  min={1000}
                  max={30000}
                  defaultValue={settings.connectionTimeoutMs}
                />
              </label>
              <p id="setting-help-connectionTimeoutMs" className="field-help">
                {adminSettingHelp.connectionTimeoutMs}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Overall request timeout (ms)
                <input
                  id="setting-overallRequestTimeoutMs"
                  aria-describedby="setting-help-overallRequestTimeoutMs"
                  name="overallRequestTimeoutMs"
                  type="number"
                  min={2000}
                  max={60000}
                  defaultValue={settings.overallRequestTimeoutMs}
                />
              </label>
              <p
                id="setting-help-overallRequestTimeoutMs"
                className="field-help"
              >
                {adminSettingHelp.overallRequestTimeoutMs}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Maximum redirects
                <input
                  id="setting-maxRedirects"
                  aria-describedby="setting-help-maxRedirects"
                  name="maxRedirects"
                  type="number"
                  min={0}
                  max={10}
                  defaultValue={settings.maxRedirects}
                />
              </label>
              <p id="setting-help-maxRedirects" className="field-help">
                {adminSettingHelp.maxRedirects}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Maximum response bytes
                <input
                  id="setting-maxResponseBytes"
                  aria-describedby="setting-help-maxResponseBytes"
                  name="maxResponseBytes"
                  type="number"
                  min={50000}
                  max={5000000}
                  defaultValue={settings.maxResponseBytes}
                />
              </label>
              <p id="setting-help-maxResponseBytes" className="field-help">
                {adminSettingHelp.maxResponseBytes}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Retry limit
                <input
                  id="setting-preflightRetryLimit"
                  aria-describedby="setting-help-preflightRetryLimit"
                  name="preflightRetryLimit"
                  type="number"
                  min={1}
                  max={5}
                  defaultValue={settings.preflightRetryLimit}
                />
              </label>
              <p id="setting-help-preflightRetryLimit" className="field-help">
                {adminSettingHelp.preflightRetryLimit}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Retry backoff seconds
                <input
                  id="setting-retryBackoffSeconds"
                  aria-describedby="setting-help-retryBackoffSeconds"
                  name="retryBackoffSeconds"
                  type="number"
                  min={10}
                  max={86400}
                  defaultValue={settings.retryBackoffSeconds}
                />
              </label>
              <p id="setting-help-retryBackoffSeconds" className="field-help">
                {adminSettingHelp.retryBackoffSeconds}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Recheck interval days
                <input
                  id="setting-preflightRecheckDays"
                  aria-describedby="setting-help-preflightRecheckDays"
                  name="preflightRecheckDays"
                  type="number"
                  min={1}
                  max={365}
                  defaultValue={settings.preflightRecheckDays}
                />
              </label>
              <p id="setting-help-preflightRecheckDays" className="field-help">
                {adminSettingHelp.preflightRecheckDays}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Fetcher user agent
                <input
                  id="setting-fetcherUserAgent"
                  aria-describedby="setting-help-fetcherUserAgent"
                  name="fetcherUserAgent"
                  minLength={20}
                  maxLength={255}
                  defaultValue={settings.fetcherUserAgent}
                />
              </label>
              <p id="setting-help-fetcherUserAgent" className="field-help">
                {adminSettingHelp.fetcherUserAgent}
              </p>
            </div>
          </div>
        </details>
        <details className="admin-card settings-group">
          <summary>Website audits: permissions & review</summary>
          <p className="settings-group-intro">
            Separate processing controls for public-site audits. An audit is
            optional and never sends outreach.
          </p>
          <div className="admin-form settings-form">
            <div className="settings-field">
              <label className="checkbox">
                <input
                  id="setting-deepAuditEnabled"
                  aria-describedby="setting-help-deepAuditEnabled"
                  name="deepAuditEnabled"
                  type="checkbox"
                  defaultChecked={settings.deepAuditEnabled}
                />{" "}
                Allow website audits
              </label>
              <p id="setting-help-deepAuditEnabled" className="field-help">
                {adminSettingHelp.deepAuditEnabled}
              </p>
            </div>
            <div className="settings-field">
              <label className="checkbox">
                <input
                  id="setting-deepAuditWorkerEnabled"
                  aria-describedby="setting-help-deepAuditWorkerEnabled"
                  name="deepAuditWorkerEnabled"
                  type="checkbox"
                  defaultChecked={settings.deepAuditWorkerEnabled}
                />{" "}
                Allow audit worker processing
              </label>
              <p
                id="setting-help-deepAuditWorkerEnabled"
                className="field-help"
              >
                {adminSettingHelp.deepAuditWorkerEnabled}
              </p>
            </div>
            <div className="settings-field">
              <label className="checkbox">
                <input
                  id="setting-pageSpeedEnabled"
                  aria-describedby="setting-help-pageSpeedEnabled"
                  name="pageSpeedEnabled"
                  type="checkbox"
                  defaultChecked={settings.pageSpeedEnabled}
                />{" "}
                PageSpeed integration enabled
              </label>
              <p id="setting-help-pageSpeedEnabled" className="field-help">
                {adminSettingHelp.pageSpeedEnabled}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Minimum Business Fit Score
                <input
                  id="setting-auditMinimumBusinessFitScore"
                  aria-describedby="setting-help-auditMinimumBusinessFitScore"
                  name="auditMinimumBusinessFitScore"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={settings.auditMinimumBusinessFitScore}
                />
              </label>
              <p
                id="setting-help-auditMinimumBusinessFitScore"
                className="field-help"
              >
                {adminSettingHelp.auditMinimumBusinessFitScore}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Minimum Audit Confidence
                <select
                  id="setting-minimumAuditConfidence"
                  aria-describedby="setting-help-minimumAuditConfidence"
                  name="minimumAuditConfidence"
                  defaultValue={settings.minimumAuditConfidence}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <p
                id="setting-help-minimumAuditConfidence"
                className="field-help"
              >
                {adminSettingHelp.minimumAuditConfidence}
              </p>
            </div>
          </div>
        </details>
        <details className="admin-card settings-group">
          <summary>Website audits: technical limits & history</summary>
          <p className="settings-group-intro">
            Advanced. Bounded checks may have incomplete coverage; retention
            does not automatically delete audit records.
          </p>
          <div className="admin-form settings-form">
            <div className="settings-field">
              <label>
                Maximum audits per day
                <input
                  id="setting-maxAuditsPerDay"
                  aria-describedby="setting-help-maxAuditsPerDay"
                  name="maxAuditsPerDay"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={settings.maxAuditsPerDay}
                />
              </label>
              <p id="setting-help-maxAuditsPerDay" className="field-help">
                {adminSettingHelp.maxAuditsPerDay}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Jobs per worker invocation
                <input
                  id="setting-maxAuditJobsPerWorkerRun"
                  aria-describedby="setting-help-maxAuditJobsPerWorkerRun"
                  name="maxAuditJobsPerWorkerRun"
                  type="number"
                  min={1}
                  max={5}
                  defaultValue={settings.maxAuditJobsPerWorkerRun}
                />
              </label>
              <p
                id="setting-help-maxAuditJobsPerWorkerRun"
                className="field-help"
              >
                {adminSettingHelp.maxAuditJobsPerWorkerRun}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Maximum concurrent audits
                <input
                  id="setting-maxConcurrentAudits"
                  aria-describedby="setting-help-maxConcurrentAudits"
                  name="maxConcurrentAudits"
                  type="number"
                  min={1}
                  max={3}
                  defaultValue={settings.maxConcurrentAudits}
                />
              </label>
              <p id="setting-help-maxConcurrentAudits" className="field-help">
                {adminSettingHelp.maxConcurrentAudits}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Maximum pages per website
                <input
                  id="setting-maxPagesPerAudit"
                  aria-describedby="setting-help-maxPagesPerAudit"
                  name="maxPagesPerAudit"
                  type="number"
                  min={1}
                  max={5}
                  defaultValue={settings.maxPagesPerAudit}
                />
              </label>
              <p id="setting-help-maxPagesPerAudit" className="field-help">
                {adminSettingHelp.maxPagesPerAudit}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Maximum internal links checked
                <input
                  id="setting-maxInternalLinksChecked"
                  aria-describedby="setting-help-maxInternalLinksChecked"
                  name="maxInternalLinksChecked"
                  type="number"
                  min={0}
                  max={50}
                  defaultValue={settings.maxInternalLinksChecked}
                />
              </label>
              <p
                id="setting-help-maxInternalLinksChecked"
                className="field-help"
              >
                {adminSettingHelp.maxInternalLinksChecked}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Per-domain delay (ms)
                <input
                  id="setting-auditPerDomainDelayMs"
                  aria-describedby="setting-help-auditPerDomainDelayMs"
                  name="auditPerDomainDelayMs"
                  type="number"
                  min={500}
                  max={60000}
                  defaultValue={settings.auditPerDomainDelayMs}
                />
              </label>
              <p id="setting-help-auditPerDomainDelayMs" className="field-help">
                {adminSettingHelp.auditPerDomainDelayMs}
              </p>
            </div>
            <div className="settings-field">
              <label>
                DNS timeout (ms)
                <input
                  id="setting-auditDnsTimeoutMs"
                  aria-describedby="setting-help-auditDnsTimeoutMs"
                  name="auditDnsTimeoutMs"
                  type="number"
                  min={500}
                  max={15000}
                  defaultValue={settings.auditDnsTimeoutMs}
                />
              </label>
              <p id="setting-help-auditDnsTimeoutMs" className="field-help">
                {adminSettingHelp.auditDnsTimeoutMs}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Connection timeout (ms)
                <input
                  id="setting-auditConnectionTimeoutMs"
                  aria-describedby="setting-help-auditConnectionTimeoutMs"
                  name="auditConnectionTimeoutMs"
                  type="number"
                  min={1000}
                  max={30000}
                  defaultValue={settings.auditConnectionTimeoutMs}
                />
              </label>
              <p
                id="setting-help-auditConnectionTimeoutMs"
                className="field-help"
              >
                {adminSettingHelp.auditConnectionTimeoutMs}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Page timeout (ms)
                <input
                  id="setting-auditPageTimeoutMs"
                  aria-describedby="setting-help-auditPageTimeoutMs"
                  name="auditPageTimeoutMs"
                  type="number"
                  min={2000}
                  max={60000}
                  defaultValue={settings.auditPageTimeoutMs}
                />
              </label>
              <p id="setting-help-auditPageTimeoutMs" className="field-help">
                {adminSettingHelp.auditPageTimeoutMs}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Overall audit timeout (ms)
                <input
                  id="setting-overallAuditTimeoutMs"
                  aria-describedby="setting-help-overallAuditTimeoutMs"
                  name="overallAuditTimeoutMs"
                  type="number"
                  min={5000}
                  max={180000}
                  defaultValue={settings.overallAuditTimeoutMs}
                />
              </label>
              <p id="setting-help-overallAuditTimeoutMs" className="field-help">
                {adminSettingHelp.overallAuditTimeoutMs}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Maximum redirects
                <input
                  id="setting-auditMaxRedirects"
                  aria-describedby="setting-help-auditMaxRedirects"
                  name="auditMaxRedirects"
                  type="number"
                  min={0}
                  max={10}
                  defaultValue={settings.auditMaxRedirects}
                />
              </label>
              <p id="setting-help-auditMaxRedirects" className="field-help">
                {adminSettingHelp.auditMaxRedirects}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Maximum bytes per page
                <input
                  id="setting-maxResponseBytesPerPage"
                  aria-describedby="setting-help-maxResponseBytesPerPage"
                  name="maxResponseBytesPerPage"
                  type="number"
                  min={50000}
                  max={2000000}
                  defaultValue={settings.maxResponseBytesPerPage}
                />
              </label>
              <p
                id="setting-help-maxResponseBytesPerPage"
                className="field-help"
              >
                {adminSettingHelp.maxResponseBytesPerPage}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Maximum bytes per audit
                <input
                  id="setting-maxTotalBytesPerAudit"
                  aria-describedby="setting-help-maxTotalBytesPerAudit"
                  name="maxTotalBytesPerAudit"
                  type="number"
                  min={100000}
                  max={8000000}
                  defaultValue={settings.maxTotalBytesPerAudit}
                />
              </label>
              <p id="setting-help-maxTotalBytesPerAudit" className="field-help">
                {adminSettingHelp.maxTotalBytesPerAudit}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Retry limit
                <input
                  id="setting-auditRetryLimit"
                  aria-describedby="setting-help-auditRetryLimit"
                  name="auditRetryLimit"
                  type="number"
                  min={1}
                  max={5}
                  defaultValue={settings.auditRetryLimit}
                />
              </label>
              <p id="setting-help-auditRetryLimit" className="field-help">
                {adminSettingHelp.auditRetryLimit}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Retry backoff seconds
                <input
                  id="setting-auditRetryBackoffSeconds"
                  aria-describedby="setting-help-auditRetryBackoffSeconds"
                  name="auditRetryBackoffSeconds"
                  type="number"
                  min={10}
                  max={86400}
                  defaultValue={settings.auditRetryBackoffSeconds}
                />
              </label>
              <p
                id="setting-help-auditRetryBackoffSeconds"
                className="field-help"
              >
                {adminSettingHelp.auditRetryBackoffSeconds}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Re-audit interval days
                <input
                  id="setting-reauditIntervalDays"
                  aria-describedby="setting-help-reauditIntervalDays"
                  name="reauditIntervalDays"
                  type="number"
                  min={1}
                  max={730}
                  defaultValue={settings.reauditIntervalDays}
                />
              </label>
              <p id="setting-help-reauditIntervalDays" className="field-help">
                {adminSettingHelp.reauditIntervalDays}
              </p>
            </div>
            <div className="settings-field">
              <label>
                Retention days (0 keeps history indefinitely)
                <input
                  id="setting-auditRetentionDays"
                  aria-describedby="setting-help-auditRetentionDays"
                  name="auditRetentionDays"
                  type="number"
                  min={0}
                  max={2555}
                  defaultValue={settings.auditRetentionDays}
                />
              </label>
              <p id="setting-help-auditRetentionDays" className="field-help">
                {adminSettingHelp.auditRetentionDays}
              </p>
            </div>
          </div>
        </details>
      </fieldset>
      <p className="field-help">
        Save applies every group, including collapsed groups. No saved values
        are changed until you submit. Worker schedules and secrets are
        configured separately in hosting.
      </p>
      <button
        className="button button-primary"
        type="submit"
        disabled={readOnly}
      >
        Save settings
      </button>
    </form>
  );
}
