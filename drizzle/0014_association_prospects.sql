CREATE TYPE "public"."association_job_kind" AS ENUM('website_scan', 'irs_sample');--> statement-breakpoint
CREATE TYPE "public"."association_review_status" AS ENUM('needs_review', 'confirmed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."association_scan_job_status" AS ENUM('queued', 'running', 'completed', 'failed', 'blocked', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."association_website_condition" AS ENUM('unassessed', 'website_not_confirmed', 'no_major_issues_detected', 'needs_manual_review', 'significant_problems', 'scan_failed', 'blocked');--> statement-breakpoint
CREATE TABLE "association_prospects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ein" varchar(9) NOT NULL,
	"name" varchar(200) NOT NULL,
	"city" varchar(120),
	"state" varchar(2),
	"subsection_code" varchar(2) DEFAULT '06' NOT NULL,
	"classification_code" varchar(4),
	"organization_status_code" varchar(2),
	"website_url" text,
	"website_condition" "association_website_condition" DEFAULT 'unassessed' NOT NULL,
	"review_status" "association_review_status" DEFAULT 'needs_review' NOT NULL,
	"public_contacts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_name" varchar(120) DEFAULT 'IRS Exempt Organizations Business Master File' NOT NULL,
	"source_url" text,
	"source_checked_at" timestamp with time zone,
	"last_checked_at" timestamp with time zone,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "association_prospect_ein_format" CHECK ("ein" ~ '^[0-9]{9}$'),
	CONSTRAINT "association_prospect_state_code" CHECK ("association_prospects"."state" is null or "association_prospects"."state" in ('AL','AK','AS','AZ','AR','CA','CO','CT','DE','DC','FL','GA','GU','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MP','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PW','PA','PR','RI','SC','SD','TN','TX','UT','VT','VI','VA','WA','WV','WI','WY','FM','MH')),
	CONSTRAINT "association_prospect_subsection_06" CHECK ("subsection_code" = '06')
);
--> statement-breakpoint
ALTER TABLE "association_prospects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "association_scan_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prospect_id" uuid,
	"kind" "association_job_kind" DEFAULT 'website_scan' NOT NULL,
	"source_state" varchar(2),
	"sample_limit" integer,
	"source_population_count" integer,
	"source_imported_count" integer,
	"status" "association_scan_job_status" DEFAULT 'queued' NOT NULL,
	"step" varchar(40) DEFAULT 'queued' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"worker_id" varchar(120),
	"claimed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"last_error" varchar(200),
	"error_classification" varchar(60),
	"created_by" varchar(254) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "association_scan_job_attempt_bound" CHECK ("association_scan_jobs"."attempt_count" >= 0 and "association_scan_jobs"."max_attempts" between 1 and 3),
	CONSTRAINT "association_scan_job_kind_inputs" CHECK (("association_scan_jobs"."kind" = 'website_scan' and "association_scan_jobs"."prospect_id" is not null and "association_scan_jobs"."source_state" is null) or ("association_scan_jobs"."kind" = 'irs_sample' and "association_scan_jobs"."prospect_id" is null and "association_scan_jobs"."source_state" is not null and "association_scan_jobs"."sample_limit" between 5 and 25))
);
--> statement-breakpoint
ALTER TABLE "association_scan_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "association_scan_jobs" ADD CONSTRAINT "association_scan_jobs_prospect_id_association_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."association_prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "association_prospect_ein_unique" ON "association_prospects" USING btree ("ein");--> statement-breakpoint
CREATE INDEX "association_prospect_state_condition_idx" ON "association_prospects" USING btree ("state","website_condition");--> statement-breakpoint
CREATE INDEX "association_prospect_review_idx" ON "association_prospects" USING btree ("review_status","updated_at");--> statement-breakpoint
CREATE INDEX "association_scan_job_status_idx" ON "association_scan_jobs" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "association_scan_job_prospect_idx" ON "association_scan_jobs" USING btree ("prospect_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "association_scan_job_active_unique" ON "association_scan_jobs" USING btree ("prospect_id") WHERE "association_scan_jobs"."prospect_id" is not null and "association_scan_jobs"."status" in ('queued','running');--> statement-breakpoint
CREATE UNIQUE INDEX "association_irs_sample_active_unique" ON "association_scan_jobs" USING btree ("source_state") WHERE "association_scan_jobs"."kind" = 'irs_sample' and "association_scan_jobs"."status" in ('queued','running');
--> statement-breakpoint
REVOKE ALL ON TABLE public.association_prospects, public.association_scan_jobs FROM PUBLIC;
--> statement-breakpoint
DO $association_prospect_grants$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
  REVOKE ALL ON TABLE public.association_prospects, public.association_scan_jobs FROM anon;
 END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
  REVOKE ALL ON TABLE public.association_prospects, public.association_scan_jobs FROM authenticated;
 END IF;
END $association_prospect_grants$;
