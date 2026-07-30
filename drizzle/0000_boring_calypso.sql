CREATE TYPE "public"."lead_status" AS ENUM('new_inbound', 'manually_added', 'needs_review', 'qualified', 'contact_planned', 'contacted', 'replied', 'consultation', 'proposal_sent', 'won', 'lost', 'suppressed');--> statement-breakpoint
CREATE TYPE "public"."submission_type" AS ENUM('homepage_review', 'project_request');--> statement-breakpoint
CREATE TABLE "admin_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_email" varchar(254) NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(80) NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_name" varchar(80) NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"page_path" varchar(300) NOT NULL,
	"referrer_domain" varchar(255),
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	"device_category" varchar(20),
	"viewport_category" varchar(20),
	"component_id" varchar(80),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "submission_type" NOT NULL,
	"name" varchar(100) NOT NULL,
	"business_name" varchar(160) NOT NULL,
	"email" varchar(254) NOT NULL,
	"website_url" text,
	"primary_goal" varchar(200),
	"website_concern" text,
	"service_needed" varchar(120),
	"project_description" text,
	"timeline" varchar(80),
	"budget_range" varchar(80),
	"idempotency_key" uuid NOT NULL,
	"consent_version" varchar(40) NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid,
	"business_name" varchar(160) NOT NULL,
	"contact_name" varchar(100),
	"email" varchar(254),
	"website_url" text,
	"category" varchar(120),
	"location" varchar(160),
	"source_name" varchar(120) NOT NULL,
	"source_url" text,
	"status" "lead_status" DEFAULT 'needs_review' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"follow_up_at" timestamp with time zone,
	"suppression_reason" text,
	"suppressed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manual_contact_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"channel" varchar(40) NOT NULL,
	"contacted_at" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outreach_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"subject" varchar(160) NOT NULL,
	"body" text NOT NULL,
	"verified_observations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ready_for_manual_use" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"from_status" "lead_status",
	"to_status" "lead_status" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"key" varchar(128) PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppression_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid,
	"normalized_email" varchar(254),
	"normalized_domain" varchar(255),
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_submission_id_contact_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."contact_submissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_contact_attempts" ADD CONSTRAINT "manual_contact_attempts_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_drafts" ADD CONSTRAINT "outreach_drafts_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_events" ADD CONSTRAINT "pipeline_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppression_entries" ADD CONSTRAINT "suppression_entries_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_occurred_idx" ON "analytics_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_event_idx" ON "analytics_events" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "analytics_session_idx" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "submission_email_idx" ON "contact_submissions" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "submission_idempotency_unique" ON "contact_submissions" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "lead_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lead_follow_up_idx" ON "leads" USING btree ("follow_up_at");--> statement-breakpoint
CREATE UNIQUE INDEX "lead_submission_unique" ON "leads" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "pipeline_lead_idx" ON "pipeline_events" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "rate_window_idx" ON "rate_limit_buckets" USING btree ("window_started_at");--> statement-breakpoint
CREATE INDEX "suppression_email_idx" ON "suppression_entries" USING btree ("normalized_email");--> statement-breakpoint
CREATE INDEX "suppression_domain_idx" ON "suppression_entries" USING btree ("normalized_domain");