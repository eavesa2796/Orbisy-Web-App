CREATE TYPE "public"."audit_eligibility_status" AS ENUM('eligible', 'needs_manual_review', 'ineligible', 'blocked', 'not_evaluated');--> statement-breakpoint
CREATE TYPE "public"."preflight_check_status" AS ENUM('passed', 'failed', 'warning', 'blocked', 'unavailable', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."preflight_job_status" AS ENUM('queued', 'running', 'passed', 'failed', 'blocked', 'skipped', 'cancelled', 'retry_scheduled');--> statement-breakpoint
CREATE TYPE "public"."preflight_run_status" AS ENUM('passed', 'failed', 'blocked', 'skipped');--> statement-breakpoint
CREATE TABLE "audit_eligibility_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"run_id" uuid,
	"score_id" uuid,
	"status" "audit_eligibility_status" DEFAULT 'not_evaluated' NOT NULL,
	"reason_codes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"explanation" text NOT NULL,
	"is_override" boolean DEFAULT false NOT NULL,
	"previous_decision_id" uuid,
	"decided_by" varchar(254),
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_fit_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"run_id" uuid,
	"score_version" varchar(40) NOT NULL,
	"total_score" integer NOT NULL,
	"factors" jsonb NOT NULL,
	"eligibility_gates" jsonb NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preflight_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"check_type" varchar(80) NOT NULL,
	"status" "preflight_check_status" NOT NULL,
	"explanation" text NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"preflight_version" varchar(40) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preflight_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"status" "preflight_job_status" DEFAULT 'queued' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"scheduled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"claimed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"last_error" text,
	"error_classification" varchar(60),
	"worker_id" varchar(120),
	"preflight_version" varchar(40) NOT NULL,
	"idempotency_key" varchar(180) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preflight_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"preflight_version" varchar(40) NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"status" "preflight_run_status" NOT NULL,
	"original_url" text,
	"normalized_url" text,
	"final_url" text,
	"website_listing_state" varchar(40) NOT NULL,
	"dns_result" varchar(60),
	"address_classification" varchar(60),
	"https_result" varchar(60),
	"tls_result" varchar(60),
	"http_status" integer,
	"redirect_count" integer,
	"content_type" varchar(120),
	"robots_result" varchar(60),
	"url_type" varchar(60),
	"target_industry_match" boolean,
	"target_location_match" boolean,
	"duplicate_state" varchar(60),
	"suppression_state" varchar(60),
	"recent_check_state" varchar(60),
	"duration_ms" integer,
	"error_category" varchar(60),
	"safe_error_summary" text,
	"evidence_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "preflight_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "worker_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "max_preflight_jobs_per_day" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "max_jobs_per_worker_run" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "max_concurrent_jobs" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "per_domain_delay_ms" integer DEFAULT 1500 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "dns_timeout_ms" integer DEFAULT 3000 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "connection_timeout_ms" integer DEFAULT 5000 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "overall_request_timeout_ms" integer DEFAULT 12000 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "max_redirects" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "max_response_bytes" integer DEFAULT 1000000 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "preflight_retry_limit" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "retry_backoff_seconds" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "preflight_recheck_days" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "minimum_business_fit_score" integer DEFAULT 65 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "require_target_industry" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "require_target_location" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "fetcher_user_agent" varchar(255) DEFAULT 'OrbisyPreflight/1.0 (+https://orbisy.com/preflight)' NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_eligibility_decisions" ADD CONSTRAINT "audit_eligibility_decisions_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_eligibility_decisions" ADD CONSTRAINT "audit_eligibility_decisions_run_id_preflight_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."preflight_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_eligibility_decisions" ADD CONSTRAINT "audit_eligibility_decisions_score_id_business_fit_scores_id_fk" FOREIGN KEY ("score_id") REFERENCES "public"."business_fit_scores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_fit_scores" ADD CONSTRAINT "business_fit_scores_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_fit_scores" ADD CONSTRAINT "business_fit_scores_run_id_preflight_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."preflight_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preflight_checks" ADD CONSTRAINT "preflight_checks_run_id_preflight_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."preflight_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preflight_jobs" ADD CONSTRAINT "preflight_jobs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preflight_runs" ADD CONSTRAINT "preflight_runs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preflight_runs" ADD CONSTRAINT "preflight_runs_job_id_preflight_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."preflight_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_eligibility_lead_idx" ON "audit_eligibility_decisions" USING btree ("lead_id","decided_at");--> statement-breakpoint
CREATE INDEX "business_fit_lead_idx" ON "business_fit_scores" USING btree ("lead_id","calculated_at");--> statement-breakpoint
CREATE INDEX "preflight_check_run_idx" ON "preflight_checks" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "preflight_job_status_schedule_idx" ON "preflight_jobs" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "preflight_job_lead_idx" ON "preflight_jobs" USING btree ("lead_id");--> statement-breakpoint
CREATE UNIQUE INDEX "preflight_job_idempotency_unique" ON "preflight_jobs" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "preflight_job_active_unique" ON "preflight_jobs" USING btree ("lead_id","preflight_version") WHERE "preflight_jobs"."status" in ('queued', 'running', 'retry_scheduled');--> statement-breakpoint
CREATE INDEX "preflight_run_lead_idx" ON "preflight_runs" USING btree ("lead_id","created_at");