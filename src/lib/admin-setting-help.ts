export const adminSettingHelp: Record<string, string> = {
  targetIndustries:
    "One matching phrase per line. Used by website-check target matching, not the public services menu. Association, nonprofit, and professional-society descriptions vary; check the actual source wording before changing rules.",
  targetLocations:
    "One matching phrase per line. Used by prospect fit checks. Existing local rules may exclude national associations; review the location requirement before researching them.",
  maxCsvBytes:
    "Upload size limit in bytes. 1,000,000 bytes is about 1 MB. Increase only if a permitted CSV needs it.",
  maxRowsPerBatch:
    "Maximum data rows accepted in one CSV. Smaller batches are easier to review for relevance and duplicates.",
  defaultSourceName:
    "Pre-filled source label for the next import. Use a recognizable source name so you can trace where records came from.",
  defaultPageSize:
    "Number of leads displayed per list page by default; it does not limit saved records.",
  likelyDuplicateThreshold:
    "Stored preference only. Current duplicate classification uses fixed identifier/name/location rules, not this number. Changing it does not tune matching. Validation still requires it to be above the possible threshold.",
  possibleDuplicateThreshold:
    "Stored preference only. Current matching uses fixed rules rather than this number. Changing it does not change the review queue. Validation still requires it below the likely threshold.",
  importRetentionDays:
    "Stored retention preference only. No automatic import-history deletion task is implemented; saving this does not remove old batches.",
  possibleDuplicatesRequireReview:
    "When checked, uncertain duplicate matches wait for your decision instead of being ready for confirmation.",
  missingWebsitesRequireReview:
    "When checked, organizations with no listed website wait for manual review. No listed website is not proof that none exists.",
  preflightEnabled:
    "Checked allows preflight jobs to be queued and processed, subject to other controls. Unchecked blocks new queue requests and prevents processing. This switch does not govern deep audits.",
  workerEnabled:
    "Allows the preflight worker to process jobs when it is invoked and preflight is allowed. Does not create a schedule or configure a worker secret.",
  maxPreflightJobsPerDay:
    "Daily cap on newly queued preflight jobs, using the database day boundary. It is not a daily lead-import limit.",
  maxJobsPerWorkerRun:
    "Maximum preflight jobs requested by one worker invocation. A smaller value limits work per run.",
  maxConcurrentJobs:
    "Currently caps the number claimed in a preflight invocation. It is not a global cross-worker concurrency lock; do not rely on it to coordinate multiple simultaneous workers.",
  perDomainDelayMs:
    "Minimum wait between checks of the same domain within a worker run. 1,000 ms is one second.",
  dnsTimeoutMs:
    "How long a hostname lookup may take, in milliseconds. A DNS failure means the check could not resolve the site, not necessarily that the site is permanently offline.",
  connectionTimeoutMs:
    "Connection time allowance in milliseconds. Very low limits can turn slow but working sites into failed checks.",
  overallRequestTimeoutMs:
    "Overall time allowance for the public-site request in milliseconds, not the complete queue waiting time.",
  maxRedirects:
    "Maximum URL forwarding hops the fetcher follows before stopping. A redirect can be a normal move from HTTP to HTTPS.",
  maxResponseBytes:
    "Maximum downloaded response size in bytes. Larger pages may be stopped rather than fully inspected.",
  preflightRetryLimit:
    "Maximum attempts stored on newly created preflight jobs, including the first attempt. Does not rewrite existing jobs’ attempt limits.",
  retryBackoffSeconds:
    "Base delay before a retry; later attempts wait longer. Only retryable failures are scheduled again.",
  preflightRecheckDays:
    "Stored preference only. The current preflight queue does not enforce a recheck interval or schedule repeat checks automatically.",
  minimumBusinessFitScore:
    "Minimum rule-based fit score for preflight audit eligibility. It reflects configured prospect criteria, not a likelihood of purchasing.",
  requireTargetIndustry:
    "Makes a known industry mismatch fail the eligibility rules. Missing industry data can still require manual review.",
  requireTargetLocation:
    "Makes a known location mismatch fail the eligibility rules. Consider national association coverage before requiring the old local-area target.",
  fetcherUserAgent:
    "The identifier sent with public-site requests by both preflight and audits. Keep it honest and identifiable; do not place tokens or credentials here.",
  deepAuditEnabled:
    "Checked allows deep-audit queueing and processing, subject to eligibility and other controls. Unchecked stops that stage; it does not disable website inquiries or client workspaces.",
  deepAuditWorkerEnabled:
    "Allows the separate audit worker to process jobs when invoked. Both the audit permission and worker controls must allow it. Does not create a schedule.",
  pageSpeedEnabled:
    "Allows optional PageSpeed performance checks. Requires its hosting API key; an unavailable check is not evidence of poor performance.",
  maxAuditsPerDay:
    "Daily cap on newly queued audit jobs, using the database day boundary. Separate from the preflight cap.",
  maxAuditJobsPerWorkerRun:
    "Maximum audit jobs claimed per invocation. Start small when testing a configured worker.",
  maxConcurrentAudits:
    "Maximum running audits considered when claiming work. Controls background load, not how many client projects Orbisy can accept.",
  maxPagesPerAudit:
    "Maximum selected public pages inspected per site. This is a bounded sample, not a complete website crawl.",
  maxInternalLinksChecked:
    "Maximum internal links inspected within an audit. Zero disables that link-check sample.",
  auditPerDomainDelayMs:
    "Wait between requests to the same domain within an audit, in milliseconds. 2,000 ms is two seconds.",
  auditDnsTimeoutMs:
    "Audit hostname-lookup time allowance, in milliseconds. Separate from the preflight setting.",
  auditConnectionTimeoutMs:
    "Audit connection time allowance in milliseconds. Separate from preflight.",
  auditPageTimeoutMs:
    "Maximum time allowance for an individual page request, in milliseconds.",
  overallAuditTimeoutMs:
    "Overall audit time budget in milliseconds. A partial run may leave warnings or limited coverage.",
  auditMaxRedirects:
    "Maximum URL forwarding hops followed on an audit request before stopping.",
  maxResponseBytesPerPage:
    "Maximum response size for one audit page in bytes. Must not exceed the total audit budget.",
  maxTotalBytesPerAudit:
    "Total response-byte budget across the audit. Must be at least the per-page limit; exceeding it limits coverage.",
  auditRetryLimit:
    "Maximum attempts stored on new audit jobs, including the first attempt. Existing job limits stay as saved.",
  auditRetryBackoffSeconds:
    "Base wait before a retryable audit attempt. Later retries use a longer delay.",
  reauditIntervalDays:
    "Blocks a new audit when a successful audit was completed too recently. It does not automatically schedule a re-audit.",
  auditMinimumBusinessFitScore:
    "Minimum fit score required at audit queueing, unless a permitted administrator eligibility override applies. Suppression and relationship safeguards still apply.",
  minimumAuditConfidence:
    "Minimum evidence-confidence level for readiness to prepare a manual outreach brief after review. It does not make incomplete findings true.",
  auditRetentionDays:
    "Stored preference only; no automatic audit-history deletion task is implemented. Zero records an intention to keep history indefinitely. Saving this does not delete records.",
};
