import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const submissionType = pgEnum("submission_type", [
  "homepage_review",
  "project_request",
]);

export const leadStatus = pgEnum("lead_status", [
  "new_inbound",
  "manually_added",
  "needs_review",
  "qualified",
  "contact_planned",
  "contacted",
  "replied",
  "consultation",
  "proposal_sent",
  "won",
  "lost",
  "suppressed",
]);

export const websiteState = pgEnum("website_state", [
  "unknown",
  "provided",
  "not_listed",
]);

export const importMethod = pgEnum("import_method", ["csv", "manual"]);

export const importBatchStatus = pgEnum("import_batch_status", [
  "draft",
  "validating",
  "ready",
  "importing",
  "completed",
  "completed_with_errors",
  "failed",
  "cancelled",
]);

export const importCandidateStatus = pgEnum("import_candidate_status", [
  "ready",
  "invalid",
  "needs_review",
  "suppressed",
  "imported",
  "skipped",
  "duplicate",
]);

export const duplicateClassification = pgEnum("duplicate_classification", [
  "new_record",
  "exact_duplicate",
  "likely_duplicate",
  "possible_duplicate",
  "existing_suppressed",
  "requires_manual_review",
]);

export const suppressionType = pgEnum("suppression_type", [
  "email",
  "domain",
  "phone",
  "source_identifier",
  "lead",
]);

export const preflightJobStatus = pgEnum("preflight_job_status", [
  "queued", "running", "passed", "failed", "blocked", "skipped",
  "cancelled", "retry_scheduled",
]);
export const preflightRunStatus = pgEnum("preflight_run_status", [
  "passed", "failed", "blocked", "skipped",
]);
export const preflightCheckStatus = pgEnum("preflight_check_status", [
  "passed", "failed", "warning", "blocked", "unavailable", "not_applicable",
]);
export const auditEligibilityStatus = pgEnum("audit_eligibility_status", [
  "eligible", "needs_manual_review", "ineligible", "blocked", "not_evaluated",
]);
export const auditJobStatus = pgEnum("audit_job_status", [
  "queued", "running", "completed", "completed_with_warnings", "failed",
  "blocked", "retry_scheduled", "cancelled",
]);
export const auditRunStatus = pgEnum("audit_run_status", [
  "running", "completed", "completed_with_warnings", "failed", "blocked",
]);
export const auditPageStatus = pgEnum("audit_page_status", [
  "inspected", "skipped", "blocked", "unavailable",
]);
export const auditFindingCategory = pgEnum("audit_finding_category", [
  "mobile_usability", "conversion_path_cta", "performance", "technical_seo",
  "accessibility", "reliability_security", "manual_review_opportunity",
]);
export const auditFindingSeverity = pgEnum("audit_finding_severity", [
  "informational", "low", "medium", "high",
]);
export const auditFindingConfidence = pgEnum("audit_finding_confidence", [
  "low", "medium", "high",
]);
export const auditFindingSource = pgEnum("audit_finding_source", ["automated", "manual"]);
export const auditVerificationStatus = pgEnum("audit_verification_status", [
  "pending", "verified", "rejected", "edited", "not_required",
]);
export const websiteImprovementBand = pgEnum("website_improvement_band", [
  "low_opportunity", "minor_opportunities", "manual_review", "strong_opportunity", "high_priority",
]);
export const auditConfidenceLevel = pgEnum("audit_confidence_level", ["low", "medium", "high"]);

export const appSettings = pgTable("app_settings", {
  id: varchar("id", { length: 40 }).primaryKey().default("default"),
  targetIndustries: jsonb("target_industries")
    .$type<string[]>()
    .default([
      "Local construction companies",
      "Independent insurance agencies",
      "Boutique marketing firms",
    ])
    .notNull(),
  targetLocations: jsonb("target_locations")
    .$type<string[]>()
    .default(["Chicago, Illinois", "Chicago metropolitan area"])
    .notNull(),
  maxCsvBytes: integer("max_csv_bytes").default(1_000_000).notNull(),
  maxRowsPerBatch: integer("max_rows_per_batch").default(500).notNull(),
  defaultSourceName: varchar("default_source_name", { length: 120 })
    .default("Permitted CSV import")
    .notNull(),
  likelyDuplicateThreshold: integer("likely_duplicate_threshold")
    .default(90)
    .notNull(),
  possibleDuplicateThreshold: integer("possible_duplicate_threshold")
    .default(70)
    .notNull(),
  possibleDuplicatesRequireReview: boolean(
    "possible_duplicates_require_review",
  )
    .default(true)
    .notNull(),
  missingWebsitesRequireReview: boolean("missing_websites_require_review")
    .default(false)
    .notNull(),
  importRetentionDays: integer("import_retention_days").default(365).notNull(),
  defaultPageSize: integer("default_page_size").default(20).notNull(),
  preflightEnabled: boolean("preflight_enabled").default(false).notNull(),
  workerEnabled: boolean("worker_enabled").default(false).notNull(),
  maxPreflightJobsPerDay: integer("max_preflight_jobs_per_day").default(100).notNull(),
  maxJobsPerWorkerRun: integer("max_jobs_per_worker_run").default(5).notNull(),
  maxConcurrentJobs: integer("max_concurrent_jobs").default(2).notNull(),
  perDomainDelayMs: integer("per_domain_delay_ms").default(1500).notNull(),
  dnsTimeoutMs: integer("dns_timeout_ms").default(3000).notNull(),
  connectionTimeoutMs: integer("connection_timeout_ms").default(5000).notNull(),
  overallRequestTimeoutMs: integer("overall_request_timeout_ms").default(12000).notNull(),
  maxRedirects: integer("max_redirects").default(5).notNull(),
  maxResponseBytes: integer("max_response_bytes").default(1_000_000).notNull(),
  preflightRetryLimit: integer("preflight_retry_limit").default(3).notNull(),
  retryBackoffSeconds: integer("retry_backoff_seconds").default(60).notNull(),
  preflightRecheckDays: integer("preflight_recheck_days").default(30).notNull(),
  minimumBusinessFitScore: integer("minimum_business_fit_score").default(65).notNull(),
  requireTargetIndustry: boolean("require_target_industry").default(true).notNull(),
  requireTargetLocation: boolean("require_target_location").default(true).notNull(),
  fetcherUserAgent: varchar("fetcher_user_agent", { length: 255 })
    .default("OrbisyPreflight/1.0 (+https://orbisy.com/preflight)").notNull(),
  deepAuditEnabled: boolean("deep_audit_enabled").default(false).notNull(),
  deepAuditWorkerEnabled: boolean("deep_audit_worker_enabled").default(false).notNull(),
  maxAuditsPerDay: integer("max_audits_per_day").default(10).notNull(),
  maxAuditJobsPerWorkerRun: integer("max_audit_jobs_per_worker_run").default(1).notNull(),
  maxConcurrentAudits: integer("max_concurrent_audits").default(1).notNull(),
  maxPagesPerAudit: integer("max_pages_per_audit").default(3).notNull(),
  maxInternalLinksChecked: integer("max_internal_links_checked").default(20).notNull(),
  auditPerDomainDelayMs: integer("audit_per_domain_delay_ms").default(2000).notNull(),
  auditDnsTimeoutMs: integer("audit_dns_timeout_ms").default(3000).notNull(),
  auditConnectionTimeoutMs: integer("audit_connection_timeout_ms").default(5000).notNull(),
  auditPageTimeoutMs: integer("audit_page_timeout_ms").default(12000).notNull(),
  overallAuditTimeoutMs: integer("overall_audit_timeout_ms").default(30000).notNull(),
  auditMaxRedirects: integer("audit_max_redirects").default(5).notNull(),
  maxResponseBytesPerPage: integer("max_response_bytes_per_page").default(1_000_000).notNull(),
  maxTotalBytesPerAudit: integer("max_total_bytes_per_audit").default(2_500_000).notNull(),
  auditRetryLimit: integer("audit_retry_limit").default(3).notNull(),
  auditRetryBackoffSeconds: integer("audit_retry_backoff_seconds").default(120).notNull(),
  reauditIntervalDays: integer("reaudit_interval_days").default(90).notNull(),
  auditMinimumBusinessFitScore: integer("audit_minimum_business_fit_score").default(65).notNull(),
  minimumAuditConfidence: auditConfidenceLevel("minimum_audit_confidence").default("medium").notNull(),
  pageSpeedEnabled: boolean("pagespeed_enabled").default(false).notNull(),
  auditRetentionDays: integer("audit_retention_days").default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  check("app_settings_audit_daily_bound", sql`${table.maxAuditsPerDay} between 1 and 100`),
  check("app_settings_audit_batch_bound", sql`${table.maxAuditJobsPerWorkerRun} between 1 and 5`),
  check("app_settings_audit_concurrency_bound", sql`${table.maxConcurrentAudits} between 1 and 3`),
  check("app_settings_audit_pages_bound", sql`${table.maxPagesPerAudit} between 1 and 5`),
  check("app_settings_audit_links_bound", sql`${table.maxInternalLinksChecked} between 0 and 50`),
  check("app_settings_audit_redirects_bound", sql`${table.auditMaxRedirects} between 0 and 10`),
  check("app_settings_audit_page_bytes_bound", sql`${table.maxResponseBytesPerPage} between 50000 and 2000000`),
  check("app_settings_audit_total_bytes_bound", sql`${table.maxTotalBytesPerAudit} between ${table.maxResponseBytesPerPage} and 8000000`),
  check("app_settings_audit_retry_bound", sql`${table.auditRetryLimit} between 1 and 5`),
  check("app_settings_audit_score_bound", sql`${table.auditMinimumBusinessFitScore} between 0 and 100`),
  check("app_settings_audit_retention_bound", sql`${table.auditRetentionDays} between 0 and 2555`),
]);

export const importBatches = pgTable(
  "import_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    originalFilename: varchar("original_filename", { length: 255 }).notNull(),
    method: importMethod("method").default("csv").notNull(),
    sourceName: varchar("source_name", { length: 120 }).notNull(),
    sourceUrl: text("source_url"),
    createdBy: varchar("created_by", { length: 254 }).notNull(),
    status: importBatchStatus("status").default("validating").notNull(),
    totalRows: integer("total_rows").default(0).notNull(),
    validRows: integer("valid_rows").default(0).notNull(),
    invalidRows: integer("invalid_rows").default(0).notNull(),
    duplicateRows: integer("duplicate_rows").default(0).notNull(),
    suppressedRows: integer("suppressed_rows").default(0).notNull(),
    importedRows: integer("imported_rows").default(0).notNull(),
    skippedRows: integer("skipped_rows").default(0).notNull(),
    errorSummary: text("error_summary"),
    administratorNotes: text("administrator_notes"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("import_batch_status_idx").on(table.status),
    index("import_batch_created_idx").on(table.createdAt),
  ],
);

export const contactSubmissions = pgTable(
  "contact_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: submissionType("type").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    businessName: varchar("business_name", { length: 160 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    websiteUrl: text("website_url"),
    primaryGoal: varchar("primary_goal", { length: 200 }),
    websiteConcern: text("website_concern"),
    serviceNeeded: varchar("service_needed", { length: 120 }),
    projectDescription: text("project_description"),
    timeline: varchar("timeline", { length: 80 }),
    budgetRange: varchar("budget_range", { length: 80 }),
    idempotencyKey: uuid("idempotency_key").notNull(),
    consentVersion: varchar("consent_version", { length: 40 }).notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("submission_email_idx").on(table.email),
    uniqueIndex("submission_idempotency_unique").on(table.idempotencyKey),
  ],
);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    submissionId: uuid("submission_id").references(() => contactSubmissions.id, {
      onDelete: "set null",
    }),
    businessName: varchar("business_name", { length: 160 }).notNull(),
    contactName: varchar("contact_name", { length: 100 }),
    email: varchar("email", { length: 254 }),
    websiteUrl: text("website_url"),
    category: varchar("category", { length: 120 }),
    location: varchar("location", { length: 160 }),
    sourceName: varchar("source_name", { length: 120 }).notNull(),
    sourceUrl: text("source_url"),
    sourceIdentifier: varchar("source_identifier", { length: 255 }),
    importBatchId: uuid("import_batch_id").references(() => importBatches.id, {
      onDelete: "set null",
    }),
    originalRowNumber: integer("original_row_number"),
    industry: varchar("industry", { length: 120 }),
    address: varchar("address", { length: 255 }),
    city: varchar("city", { length: 120 }),
    state: varchar("state", { length: 80 }),
    postalCode: varchar("postal_code", { length: 20 }),
    phone: varchar("phone", { length: 40 }),
    normalizedEmail: varchar("normalized_email", { length: 254 }),
    normalizedDomain: varchar("normalized_domain", { length: 255 }),
    normalizedPhone: varchar("normalized_phone", { length: 20 }),
    websiteState: websiteState("website_state").default("unknown").notNull(),
    dateDiscovered: timestamp("date_discovered", { withTimezone: true }),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    duplicateReviewStatus: varchar("duplicate_review_status", { length: 40 }),
    manualReviewStatus: varchar("manual_review_status", { length: 40 }),
    status: leadStatus("status").default("needs_review").notNull(),
    priority: integer("priority").default(0).notNull(),
    followUpAt: timestamp("follow_up_at", { withTimezone: true }),
    suppressionReason: text("suppression_reason"),
    suppressedAt: timestamp("suppressed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("lead_status_idx").on(table.status),
    index("lead_follow_up_idx").on(table.followUpAt),
    index("lead_import_batch_idx").on(table.importBatchId),
    index("lead_normalized_domain_idx").on(table.normalizedDomain),
    index("lead_normalized_email_idx").on(table.normalizedEmail),
    index("lead_normalized_phone_idx").on(table.normalizedPhone),
    index("lead_source_identifier_idx").on(table.sourceIdentifier),
    uniqueIndex("lead_submission_unique").on(table.submissionId),
  ],
);

export const importCandidates = pgTable(
  "import_candidates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    importBatchId: uuid("import_batch_id")
      .notNull()
      .references(() => importBatches.id, { onDelete: "cascade" }),
    originalRowNumber: integer("original_row_number").notNull(),
    originalData: jsonb("original_data")
      .$type<Record<string, string>>()
      .default({})
      .notNull(),
    businessName: varchar("business_name", { length: 160 }),
    normalizedBusinessName: varchar("normalized_business_name", {
      length: 160,
    }),
    category: varchar("category", { length: 120 }),
    industry: varchar("industry", { length: 120 }),
    address: varchar("address", { length: 255 }),
    city: varchar("city", { length: 120 }),
    state: varchar("state", { length: 80 }),
    postalCode: varchar("postal_code", { length: 20 }),
    location: varchar("location", { length: 160 }),
    websiteUrl: text("website_url"),
    websiteState: websiteState("website_state").default("unknown").notNull(),
    normalizedDomain: varchar("normalized_domain", { length: 255 }),
    email: varchar("email", { length: 254 }),
    normalizedEmail: varchar("normalized_email", { length: 254 }),
    phone: varchar("phone", { length: 40 }),
    normalizedPhone: varchar("normalized_phone", { length: 20 }),
    contactName: varchar("contact_name", { length: 100 }),
    sourceName: varchar("source_name", { length: 120 }).notNull(),
    sourceUrl: text("source_url"),
    sourceIdentifier: varchar("source_identifier", { length: 255 }),
    dateDiscovered: timestamp("date_discovered", { withTimezone: true }),
    validationErrors: jsonb("validation_errors")
      .$type<string[]>()
      .default([])
      .notNull(),
    validationWarnings: jsonb("validation_warnings")
      .$type<string[]>()
      .default([])
      .notNull(),
    duplicateClassification: duplicateClassification(
      "duplicate_classification",
    )
      .default("new_record")
      .notNull(),
    duplicateReasons: jsonb("duplicate_reasons")
      .$type<string[]>()
      .default([])
      .notNull(),
    matchedLeadId: uuid("matched_lead_id").references(() => leads.id, {
      onDelete: "set null",
    }),
    suppressionEntryId: uuid("suppression_entry_id"),
    status: importCandidateStatus("status").default("ready").notNull(),
    administratorDecision: varchar("administrator_decision", { length: 60 }),
    decidedBy: varchar("decided_by", { length: 254 }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    importedLeadId: uuid("imported_lead_id").references(() => leads.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("import_candidate_batch_row_unique").on(
      table.importBatchId,
      table.originalRowNumber,
    ),
    index("import_candidate_batch_idx").on(table.importBatchId),
    index("import_candidate_status_idx").on(table.status),
    index("import_candidate_domain_idx").on(table.normalizedDomain),
    foreignKey({
      columns: [table.suppressionEntryId],
      foreignColumns: [suppressionEntries.id],
      name: "import_candidate_suppression_fk",
    }).onDelete("set null"),
  ],
);

export const leadNotes = pgTable("lead_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const pipelineEvents = pgTable(
  "pipeline_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    fromStatus: leadStatus("from_status"),
    toStatus: leadStatus("to_status").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("pipeline_lead_idx").on(table.leadId)],
);

export const manualContactAttempts = pgTable("manual_contact_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  channel: varchar("channel", { length: 40 }).notNull(),
  contactedAt: timestamp("contacted_at", { withTimezone: true }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const suppressionEntries = pgTable(
  "suppression_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }),
    normalizedEmail: varchar("normalized_email", { length: 254 }),
    normalizedDomain: varchar("normalized_domain", { length: 255 }),
    normalizedPhone: varchar("normalized_phone", { length: 20 }),
    normalizedSourceIdentifier: varchar("normalized_source_identifier", {
      length: 255,
    }),
    type: suppressionType("type").default("lead").notNull(),
    source: varchar("source", { length: 120 }).default("Administrator").notNull(),
    createdBy: varchar("created_by", { length: 254 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("suppression_email_idx").on(table.normalizedEmail),
    index("suppression_domain_idx").on(table.normalizedDomain),
    index("suppression_phone_idx").on(table.normalizedPhone),
    index("suppression_source_identifier_idx").on(
      table.normalizedSourceIdentifier,
    ),
  ],
);

export const businessSourceRecords = pgTable(
  "business_source_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id").references(() => importCandidates.id, {
      onDelete: "set null",
    }),
    importBatchId: uuid("import_batch_id").references(() => importBatches.id, {
      onDelete: "set null",
    }),
    providerName: varchar("provider_name", { length: 120 }).notNull(),
    sourceUrl: text("source_url"),
    sourceIdentifier: varchar("source_identifier", { length: 255 }),
    originalRowNumber: integer("original_row_number"),
    minimizedSnapshot: jsonb("minimized_snapshot")
      .$type<Record<string, string>>()
      .default({})
      .notNull(),
    attributionNotes: text("attribution_notes"),
    discoveredAt: timestamp("discovered_at", { withTimezone: true }),
    importedAt: timestamp("imported_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  },
  (table) => [
    index("source_record_lead_idx").on(table.leadId),
    index("source_record_batch_idx").on(table.importBatchId),
  ],
);

export const adminActivityLogs = pgTable("admin_activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminEmail: varchar("admin_email", { length: 254 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventName: varchar("event_name", { length: 80 }).notNull(),
    sessionId: varchar("session_id", { length: 64 }).notNull(),
    pagePath: varchar("page_path", { length: 300 }).notNull(),
    referrerDomain: varchar("referrer_domain", { length: 255 }),
    utmSource: varchar("utm_source", { length: 100 }),
    utmMedium: varchar("utm_medium", { length: 100 }),
    utmCampaign: varchar("utm_campaign", { length: 100 }),
    deviceCategory: varchar("device_category", { length: 20 }),
    viewportCategory: varchar("viewport_category", { length: 20 }),
    componentId: varchar("component_id", { length: 80 }),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("analytics_occurred_idx").on(table.occurredAt),
    index("analytics_event_idx").on(table.eventName),
    index("analytics_session_idx").on(table.sessionId),
  ],
);

export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    key: varchar("key", { length: 128 }).primaryKey(),
    count: integer("count").default(1).notNull(),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("rate_window_idx").on(table.windowStartedAt)],
);

export const preflightJobs = pgTable("preflight_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  status: preflightJobStatus("status").default("queued").notNull(),
  attemptCount: integer("attempt_count").default(0).notNull(),
  maxAttempts: integer("max_attempts").default(3).notNull(),
  priority: integer("priority").default(0).notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).defaultNow().notNull(),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  lastError: text("last_error"),
  errorClassification: varchar("error_classification", { length: 60 }),
  workerId: varchar("worker_id", { length: 120 }),
  preflightVersion: varchar("preflight_version", { length: 40 }).notNull(),
  idempotencyKey: varchar("idempotency_key", { length: 180 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("preflight_job_status_schedule_idx").on(table.status, table.scheduledAt),
  index("preflight_job_lead_idx").on(table.leadId),
  uniqueIndex("preflight_job_idempotency_unique").on(table.idempotencyKey),
  uniqueIndex("preflight_job_active_unique").on(table.leadId, table.preflightVersion)
    .where(sql`${table.status} in ('queued', 'running', 'retry_scheduled')`),
]);

export const preflightRuns = pgTable("preflight_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  jobId: uuid("job_id").notNull().references(() => preflightJobs.id, { onDelete: "cascade" }),
  preflightVersion: varchar("preflight_version", { length: 40 }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  status: preflightRunStatus("status").notNull(),
  originalUrl: text("original_url"), normalizedUrl: text("normalized_url"), finalUrl: text("final_url"),
  websiteListingState: varchar("website_listing_state", { length: 40 }).notNull(),
  dnsResult: varchar("dns_result", { length: 60 }), addressClassification: varchar("address_classification", { length: 60 }),
  httpsResult: varchar("https_result", { length: 60 }), tlsResult: varchar("tls_result", { length: 60 }),
  httpStatus: integer("http_status"), redirectCount: integer("redirect_count"), contentType: varchar("content_type", { length: 120 }),
  robotsResult: varchar("robots_result", { length: 60 }), urlType: varchar("url_type", { length: 60 }),
  targetIndustryMatch: boolean("target_industry_match"), targetLocationMatch: boolean("target_location_match"),
  duplicateState: varchar("duplicate_state", { length: 60 }), suppressionState: varchar("suppression_state", { length: 60 }),
  recentCheckState: varchar("recent_check_state", { length: 60 }), durationMs: integer("duration_ms"),
  errorCategory: varchar("error_category", { length: 60 }), safeErrorSummary: text("safe_error_summary"),
  evidenceSnapshot: jsonb("evidence_snapshot").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("preflight_run_lead_idx").on(table.leadId, table.createdAt)]);

export const preflightChecks = pgTable("preflight_checks", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id").notNull().references(() => preflightRuns.id, { onDelete: "cascade" }),
  checkType: varchar("check_type", { length: 80 }).notNull(), status: preflightCheckStatus("status").notNull(),
  explanation: text("explanation").notNull(), evidence: jsonb("evidence").$type<Record<string, unknown>>().default({}).notNull(),
  checkedAt: timestamp("checked_at", { withTimezone: true }).defaultNow().notNull(),
  preflightVersion: varchar("preflight_version", { length: 40 }).notNull(),
}, (table) => [index("preflight_check_run_idx").on(table.runId)]);

export const businessFitScores = pgTable("business_fit_scores", {
  id: uuid("id").defaultRandom().primaryKey(), leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  runId: uuid("run_id").references(() => preflightRuns.id, { onDelete: "set null" }), scoreVersion: varchar("score_version", { length: 40 }).notNull(),
  totalScore: integer("total_score").notNull(), factors: jsonb("factors").$type<unknown[]>().notNull(),
  eligibilityGates: jsonb("eligibility_gates").$type<unknown[]>().notNull(), inputSnapshot: jsonb("input_snapshot").$type<Record<string, unknown>>().notNull(),
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("business_fit_lead_idx").on(table.leadId, table.calculatedAt)]);

export const auditEligibilityDecisions = pgTable("audit_eligibility_decisions", {
  id: uuid("id").defaultRandom().primaryKey(), leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  runId: uuid("run_id").references(() => preflightRuns.id, { onDelete: "set null" }), scoreId: uuid("score_id").references(() => businessFitScores.id, { onDelete: "set null" }),
  status: auditEligibilityStatus("status").default("not_evaluated").notNull(), reasonCodes: jsonb("reason_codes").$type<string[]>().default([]).notNull(),
  explanation: text("explanation").notNull(), isOverride: boolean("is_override").default(false).notNull(), previousDecisionId: uuid("previous_decision_id"),
  decidedBy: varchar("decided_by", { length: 254 }), decidedAt: timestamp("decided_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("audit_eligibility_lead_idx").on(table.leadId, table.decidedAt)]);

export const auditJobs = pgTable("audit_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  eligibilityDecisionId: uuid("eligibility_decision_id").notNull().references(() => auditEligibilityDecisions.id, { onDelete: "restrict" }),
  status: auditJobStatus("status").default("queued").notNull(),
  priority: integer("priority").default(0).notNull(),
  attemptCount: integer("attempt_count").default(0).notNull(),
  maxAttempts: integer("max_attempts").default(3).notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).defaultNow().notNull(),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  workerId: varchar("worker_id", { length: 120 }),
  auditVersion: varchar("audit_version", { length: 40 }).notNull(),
  idempotencyKey: varchar("idempotency_key", { length: 180 }).notNull(),
  lastError: text("last_error"),
  errorClassification: varchar("error_classification", { length: 60 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("audit_job_status_schedule_idx").on(table.status, table.scheduledAt),
  index("audit_job_lead_idx").on(table.leadId, table.createdAt),
  uniqueIndex("audit_job_idempotency_unique").on(table.idempotencyKey),
  uniqueIndex("audit_job_active_unique").on(table.leadId, table.auditVersion)
    .where(sql`${table.status} in ('queued', 'running', 'retry_scheduled')`),
  check("audit_job_attempt_bound", sql`${table.attemptCount} >= 0 and ${table.maxAttempts} between 1 and 5`),
]).enableRLS();

export const auditRuns = pgTable("audit_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").notNull().references(() => auditJobs.id, { onDelete: "cascade" }),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  auditVersion: varchar("audit_version", { length: 40 }).notNull(),
  status: auditRunStatus("status").default("running").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  settingsSnapshot: jsonb("settings_snapshot").$type<Record<string, unknown>>().default({}).notNull(),
  analyzerAvailability: jsonb("analyzer_availability").$type<Record<string, unknown>>().default({}).notNull(),
  errorClassification: varchar("error_classification", { length: 60 }),
  safeErrorSummary: text("safe_error_summary"),
  reviewCompletedAt: timestamp("review_completed_at", { withTimezone: true }),
  reviewCompletedBy: varchar("review_completed_by", { length: 254 }),
  phaseFiveReady: boolean("phase_five_ready").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("audit_run_lead_created_idx").on(table.leadId, table.createdAt),
  index("audit_run_job_idx").on(table.jobId),
]).enableRLS();

export const auditPages = pgTable("audit_pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id").notNull().references(() => auditRuns.id, { onDelete: "cascade" }),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  requestedUrl: text("requested_url").notNull(),
  finalUrl: text("final_url"),
  pageType: varchar("page_type", { length: 40 }).notNull(),
  selectionReason: text("selection_reason").notNull(),
  status: auditPageStatus("status").notNull(),
  statusReason: text("status_reason"),
  httpStatus: integer("http_status"),
  contentType: varchar("content_type", { length: 120 }),
  responseBytes: integer("response_bytes"),
  redirectCount: integer("redirect_count"),
  durationMs: integer("duration_ms"),
  robotsResult: varchar("robots_result", { length: 60 }),
  errorClassification: varchar("error_classification", { length: 60 }),
  safeErrorSummary: text("safe_error_summary"),
  inspectedAt: timestamp("inspected_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("audit_page_run_idx").on(table.runId, table.createdAt)]).enableRLS();

export const auditFindings = pgTable("audit_findings", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id").notNull().references(() => auditRuns.id, { onDelete: "cascade" }),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  category: auditFindingCategory("category").notNull(),
  findingType: varchar("finding_type", { length: 100 }).notNull(),
  originalExplanation: text("original_explanation").notNull(),
  administratorExplanation: text("administrator_explanation"),
  evidence: jsonb("evidence").$type<Record<string, unknown>>().default({}).notNull(),
  affectedUrl: text("affected_url"),
  severity: auditFindingSeverity("severity").notNull(),
  confidence: auditFindingConfidence("confidence").notNull(),
  source: auditFindingSource("source").notNull(),
  verificationStatus: auditVerificationStatus("verification_status").default("pending").notNull(),
  suggestedImprovement: text("suggested_improvement").notNull(),
  analyzerVersion: varchar("analyzer_version", { length: 40 }).notNull(),
  verifiedBy: varchar("verified_by", { length: 254 }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  auditTimestamp: timestamp("audit_timestamp", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("audit_finding_run_category_idx").on(table.runId, table.category),
  index("audit_finding_review_idx").on(table.verificationStatus, table.createdAt),
]).enableRLS();

export const scoreVersions = pgTable("score_versions", {
  version: varchar("version", { length: 40 }).primaryKey(),
  categoryWeights: jsonb("category_weights").$type<Record<string, number>>().notNull(),
  rules: jsonb("rules").$type<Record<string, unknown>>().notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const websiteImprovementScores = pgTable("website_improvement_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id").notNull().references(() => auditRuns.id, { onDelete: "cascade" }),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  scoreVersion: varchar("score_version", { length: 40 }).notNull().references(() => scoreVersions.version, { onDelete: "restrict" }),
  categoryResults: jsonb("category_results").$type<Record<string, unknown>>().notNull(),
  findingIds: jsonb("finding_ids").$type<string[]>().default([]).notNull(),
  inputSnapshot: jsonb("input_snapshot").$type<Record<string, unknown>>().notNull(),
  totalScore: integer("total_score").notNull(),
  scoreBand: websiteImprovementBand("score_band").notNull(),
  coveragePercent: integer("coverage_percent").notNull(),
  provisional: boolean("provisional").default(true).notNull(),
  manuallyReviewed: boolean("manually_reviewed").default(false).notNull(),
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("website_score_run_idx").on(table.runId, table.calculatedAt),
  check("website_score_total_bound", sql`${table.totalScore} between 0 and 100`),
  check("website_score_coverage_bound", sql`${table.coveragePercent} between 0 and 100`),
]).enableRLS();

export const auditConfidenceScores = pgTable("audit_confidence_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id").notNull().references(() => auditRuns.id, { onDelete: "cascade" }),
  level: auditConfidenceLevel("level").notNull(),
  factors: jsonb("factors").$type<Record<string, unknown>>().notNull(),
  explanation: text("explanation").notNull(),
  calculationVersion: varchar("calculation_version", { length: 40 }).notNull(),
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("audit_confidence_run_idx").on(table.runId, table.calculatedAt)]).enableRLS();

export const auditReviewEvents = pgTable("audit_review_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id").notNull().references(() => auditRuns.id, { onDelete: "cascade" }),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  findingId: uuid("finding_id").references(() => auditFindings.id, { onDelete: "set null" }),
  eventType: varchar("event_type", { length: 80 }).notNull(),
  administratorEmail: varchar("administrator_email", { length: 254 }).notNull(),
  explanation: text("explanation").notNull(),
  evidence: jsonb("evidence").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("audit_review_run_idx").on(table.runId, table.createdAt)]).enableRLS();

export const outreachDrafts = pgTable("outreach_drafts", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  auditRunId: uuid("audit_run_id").references(() => auditRuns.id, {
    onDelete: "set null",
  }),
  briefVersion: varchar("brief_version", { length: 40 })
    .default("outreach-brief-v1")
    .notNull(),
  status: varchar("status", { length: 30 }).default("draft").notNull(),
  subject: varchar("subject", { length: 160 }).notNull(),
  body: text("body").notNull(),
  relevantContext: text("relevant_context"),
  verifiedObservations: jsonb("verified_observations")
    .$type<string[]>()
    .default([])
    .notNull(),
  selectedFindingIds: jsonb("selected_finding_ids")
    .$type<string[]>()
    .default([])
    .notNull(),
  whyItMayMatter: text("why_it_may_matter"),
  suggestedImprovement: text("suggested_improvement"),
  personalizationNotes: text("personalization_notes"),
  recommendedNextAction: text("recommended_next_action"),
  readyForManualUse: boolean("ready_for_manual_use").default(false).notNull(),
  reviewedBy: varchar("reviewed_by", { length: 254 }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  index("outreach_draft_lead_updated_idx").on(table.leadId, table.updatedAt),
  index("outreach_draft_audit_run_idx").on(table.auditRunId),
  check("outreach_draft_status_check", sql`${table.status} in ('draft','approved','stale','blocked')`),
]).enableRLS();
