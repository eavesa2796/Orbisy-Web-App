import {
  boolean,
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
    uniqueIndex("lead_submission_unique").on(table.submissionId),
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
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("suppression_email_idx").on(table.normalizedEmail),
    index("suppression_domain_idx").on(table.normalizedDomain),
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
