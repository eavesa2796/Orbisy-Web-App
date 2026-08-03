CREATE TYPE "public"."audit_confidence_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."audit_finding_category" AS ENUM('mobile_usability', 'conversion_path_cta', 'performance', 'technical_seo', 'accessibility', 'reliability_security', 'manual_review_opportunity');--> statement-breakpoint
CREATE TYPE "public"."audit_finding_confidence" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."audit_finding_severity" AS ENUM('informational', 'low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."audit_finding_source" AS ENUM('automated', 'manual');--> statement-breakpoint
CREATE TYPE "public"."audit_job_status" AS ENUM('queued', 'running', 'completed', 'completed_with_warnings', 'failed', 'blocked', 'retry_scheduled', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."audit_page_status" AS ENUM('inspected', 'skipped', 'blocked', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."audit_run_status" AS ENUM('running', 'completed', 'completed_with_warnings', 'failed', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."audit_verification_status" AS ENUM('pending', 'verified', 'rejected', 'edited', 'not_required');--> statement-breakpoint
CREATE TYPE "public"."website_improvement_band" AS ENUM('low_opportunity', 'minor_opportunities', 'manual_review', 'strong_opportunity', 'high_priority');--> statement-breakpoint
CREATE TABLE "audit_confidence_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"level" "audit_confidence_level" NOT NULL,
	"factors" jsonb NOT NULL,
	"explanation" text NOT NULL,
	"calculation_version" varchar(40) NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_confidence_scores" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"category" "audit_finding_category" NOT NULL,
	"finding_type" varchar(100) NOT NULL,
	"original_explanation" text NOT NULL,
	"administrator_explanation" text,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"affected_url" text,
	"severity" "audit_finding_severity" NOT NULL,
	"confidence" "audit_finding_confidence" NOT NULL,
	"source" "audit_finding_source" NOT NULL,
	"verification_status" "audit_verification_status" DEFAULT 'pending' NOT NULL,
	"suggested_improvement" text NOT NULL,
	"analyzer_version" varchar(40) NOT NULL,
	"verified_by" varchar(254),
	"verified_at" timestamp with time zone,
	"audit_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_findings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"eligibility_decision_id" uuid NOT NULL,
	"status" "audit_job_status" DEFAULT 'queued' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"scheduled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"claimed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"worker_id" varchar(120),
	"audit_version" varchar(40) NOT NULL,
	"idempotency_key" varchar(180) NOT NULL,
	"last_error" text,
	"error_classification" varchar(60),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"requested_url" text NOT NULL,
	"final_url" text,
	"page_type" varchar(40) NOT NULL,
	"selection_reason" text NOT NULL,
	"status" "audit_page_status" NOT NULL,
	"status_reason" text,
	"http_status" integer,
	"content_type" varchar(120),
	"response_bytes" integer,
	"redirect_count" integer,
	"duration_ms" integer,
	"robots_result" varchar(60),
	"error_classification" varchar(60),
	"safe_error_summary" text,
	"inspected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_pages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_review_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"finding_id" uuid,
	"event_type" varchar(80) NOT NULL,
	"administrator_email" varchar(254) NOT NULL,
	"explanation" text NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_review_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"audit_version" varchar(40) NOT NULL,
	"status" "audit_run_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"settings_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"analyzer_availability" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error_classification" varchar(60),
	"safe_error_summary" text,
	"review_completed_at" timestamp with time zone,
	"review_completed_by" varchar(254),
	"phase_five_ready" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "score_versions" (
	"version" varchar(40) PRIMARY KEY NOT NULL,
	"category_weights" jsonb NOT NULL,
	"rules" jsonb NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "score_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "website_improvement_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"score_version" varchar(40) NOT NULL,
	"category_results" jsonb NOT NULL,
	"finding_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"total_score" integer NOT NULL,
	"score_band" "website_improvement_band" NOT NULL,
	"coverage_percent" integer NOT NULL,
	"provisional" boolean DEFAULT true NOT NULL,
	"manually_reviewed" boolean DEFAULT false NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "website_improvement_scores" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "deep_audit_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "deep_audit_worker_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "max_audits_per_day" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "max_audit_jobs_per_worker_run" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "max_concurrent_audits" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "max_pages_per_audit" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "max_internal_links_checked" integer DEFAULT 20 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "audit_per_domain_delay_ms" integer DEFAULT 2000 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "audit_dns_timeout_ms" integer DEFAULT 3000 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "audit_connection_timeout_ms" integer DEFAULT 5000 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "audit_page_timeout_ms" integer DEFAULT 12000 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "overall_audit_timeout_ms" integer DEFAULT 30000 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "audit_max_redirects" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "max_response_bytes_per_page" integer DEFAULT 1000000 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "max_total_bytes_per_audit" integer DEFAULT 2500000 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "audit_retry_limit" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "audit_retry_backoff_seconds" integer DEFAULT 120 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "reaudit_interval_days" integer DEFAULT 90 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "audit_minimum_business_fit_score" integer DEFAULT 65 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "minimum_audit_confidence" "audit_confidence_level" DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "pagespeed_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "audit_retention_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_confidence_scores" ADD CONSTRAINT "audit_confidence_scores_run_id_audit_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."audit_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_run_id_audit_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."audit_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_jobs" ADD CONSTRAINT "audit_jobs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_jobs" ADD CONSTRAINT "audit_jobs_eligibility_decision_id_audit_eligibility_decisions_id_fk" FOREIGN KEY ("eligibility_decision_id") REFERENCES "public"."audit_eligibility_decisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_pages" ADD CONSTRAINT "audit_pages_run_id_audit_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."audit_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_pages" ADD CONSTRAINT "audit_pages_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_review_events" ADD CONSTRAINT "audit_review_events_run_id_audit_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."audit_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_review_events" ADD CONSTRAINT "audit_review_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_review_events" ADD CONSTRAINT "audit_review_events_finding_id_audit_findings_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."audit_findings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_runs" ADD CONSTRAINT "audit_runs_job_id_audit_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."audit_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_runs" ADD CONSTRAINT "audit_runs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_improvement_scores" ADD CONSTRAINT "website_improvement_scores_run_id_audit_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."audit_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_improvement_scores" ADD CONSTRAINT "website_improvement_scores_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_improvement_scores" ADD CONSTRAINT "website_improvement_scores_score_version_score_versions_version_fk" FOREIGN KEY ("score_version") REFERENCES "public"."score_versions"("version") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_confidence_run_idx" ON "audit_confidence_scores" USING btree ("run_id","calculated_at");--> statement-breakpoint
CREATE INDEX "audit_finding_run_category_idx" ON "audit_findings" USING btree ("run_id","category");--> statement-breakpoint
CREATE INDEX "audit_finding_review_idx" ON "audit_findings" USING btree ("verification_status","created_at");--> statement-breakpoint
CREATE INDEX "audit_job_status_schedule_idx" ON "audit_jobs" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "audit_job_lead_idx" ON "audit_jobs" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "audit_job_idempotency_unique" ON "audit_jobs" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "audit_job_active_unique" ON "audit_jobs" USING btree ("lead_id","audit_version") WHERE "audit_jobs"."status" in ('queued', 'running', 'retry_scheduled');--> statement-breakpoint
CREATE INDEX "audit_page_run_idx" ON "audit_pages" USING btree ("run_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_review_run_idx" ON "audit_review_events" USING btree ("run_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_run_lead_created_idx" ON "audit_runs" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_run_job_idx" ON "audit_runs" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "website_score_run_idx" ON "website_improvement_scores" USING btree ("run_id","calculated_at");