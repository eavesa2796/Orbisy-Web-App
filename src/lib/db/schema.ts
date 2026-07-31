import {
  boolean,
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
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

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

export const outreachDrafts = pgTable("outreach_drafts", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 160 }).notNull(),
  body: text("body").notNull(),
  verifiedObservations: jsonb("verified_observations")
    .$type<string[]>()
    .default([])
    .notNull(),
  readyForManualUse: boolean("ready_for_manual_use").default(false).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
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
