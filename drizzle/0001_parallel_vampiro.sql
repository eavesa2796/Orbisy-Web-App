CREATE TYPE "public"."duplicate_classification" AS ENUM('new_record', 'exact_duplicate', 'likely_duplicate', 'possible_duplicate', 'existing_suppressed', 'requires_manual_review');--> statement-breakpoint
CREATE TYPE "public"."import_batch_status" AS ENUM('draft', 'validating', 'ready', 'importing', 'completed', 'completed_with_errors', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."import_candidate_status" AS ENUM('ready', 'invalid', 'needs_review', 'suppressed', 'imported', 'skipped', 'duplicate');--> statement-breakpoint
CREATE TYPE "public"."import_method" AS ENUM('csv', 'manual');--> statement-breakpoint
CREATE TYPE "public"."suppression_type" AS ENUM('email', 'domain', 'phone', 'source_identifier', 'lead');--> statement-breakpoint
CREATE TYPE "public"."website_state" AS ENUM('unknown', 'provided', 'not_listed');--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" varchar(40) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"target_industries" jsonb DEFAULT '["Local construction companies","Independent insurance agencies","Boutique marketing firms"]'::jsonb NOT NULL,
	"target_locations" jsonb DEFAULT '["Chicago, Illinois","Chicago metropolitan area"]'::jsonb NOT NULL,
	"max_csv_bytes" integer DEFAULT 1000000 NOT NULL,
	"max_rows_per_batch" integer DEFAULT 500 NOT NULL,
	"default_source_name" varchar(120) DEFAULT 'Permitted CSV import' NOT NULL,
	"likely_duplicate_threshold" integer DEFAULT 90 NOT NULL,
	"possible_duplicate_threshold" integer DEFAULT 70 NOT NULL,
	"possible_duplicates_require_review" boolean DEFAULT true NOT NULL,
	"missing_websites_require_review" boolean DEFAULT false NOT NULL,
	"import_retention_days" integer DEFAULT 365 NOT NULL,
	"default_page_size" integer DEFAULT 20 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_source_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid,
	"candidate_id" uuid,
	"import_batch_id" uuid,
	"provider_name" varchar(120) NOT NULL,
	"source_url" text,
	"source_identifier" varchar(255),
	"original_row_number" integer,
	"minimized_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attribution_notes" text,
	"discovered_at" timestamp with time zone,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_verified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"method" "import_method" DEFAULT 'csv' NOT NULL,
	"source_name" varchar(120) NOT NULL,
	"source_url" text,
	"created_by" varchar(254) NOT NULL,
	"status" "import_batch_status" DEFAULT 'validating' NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"valid_rows" integer DEFAULT 0 NOT NULL,
	"invalid_rows" integer DEFAULT 0 NOT NULL,
	"duplicate_rows" integer DEFAULT 0 NOT NULL,
	"suppressed_rows" integer DEFAULT 0 NOT NULL,
	"imported_rows" integer DEFAULT 0 NOT NULL,
	"skipped_rows" integer DEFAULT 0 NOT NULL,
	"error_summary" text,
	"administrator_notes" text,
	"confirmed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_batch_id" uuid NOT NULL,
	"original_row_number" integer NOT NULL,
	"original_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"business_name" varchar(160),
	"normalized_business_name" varchar(160),
	"category" varchar(120),
	"industry" varchar(120),
	"address" varchar(255),
	"city" varchar(120),
	"state" varchar(80),
	"postal_code" varchar(20),
	"location" varchar(160),
	"website_url" text,
	"website_state" "website_state" DEFAULT 'unknown' NOT NULL,
	"normalized_domain" varchar(255),
	"email" varchar(254),
	"normalized_email" varchar(254),
	"phone" varchar(40),
	"normalized_phone" varchar(20),
	"contact_name" varchar(100),
	"source_name" varchar(120) NOT NULL,
	"source_url" text,
	"source_identifier" varchar(255),
	"date_discovered" timestamp with time zone,
	"validation_errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"validation_warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"duplicate_classification" "duplicate_classification" DEFAULT 'new_record' NOT NULL,
	"duplicate_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"matched_lead_id" uuid,
	"suppression_entry_id" uuid,
	"status" "import_candidate_status" DEFAULT 'ready' NOT NULL,
	"administrator_decision" varchar(60),
	"decided_by" varchar(254),
	"decided_at" timestamp with time zone,
	"imported_lead_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "source_identifier" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "import_batch_id" uuid;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "original_row_number" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "industry" varchar(120);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "address" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "city" varchar(120);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "state" varchar(80);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "postal_code" varchar(20);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "phone" varchar(40);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "normalized_email" varchar(254);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "normalized_domain" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "normalized_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "website_state" "website_state" DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "date_discovered" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "last_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "duplicate_review_status" varchar(40);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "manual_review_status" varchar(40);--> statement-breakpoint
ALTER TABLE "suppression_entries" ADD COLUMN "normalized_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "suppression_entries" ADD COLUMN "normalized_source_identifier" varchar(255);--> statement-breakpoint
ALTER TABLE "suppression_entries" ADD COLUMN "type" "suppression_type" DEFAULT 'lead' NOT NULL;--> statement-breakpoint
ALTER TABLE "suppression_entries" ADD COLUMN "source" varchar(120) DEFAULT 'Administrator' NOT NULL;--> statement-breakpoint
ALTER TABLE "suppression_entries" ADD COLUMN "created_by" varchar(254);--> statement-breakpoint
ALTER TABLE "suppression_entries" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "business_source_records" ADD CONSTRAINT "business_source_records_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_source_records" ADD CONSTRAINT "business_source_records_candidate_id_import_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."import_candidates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_source_records" ADD CONSTRAINT "business_source_records_import_batch_id_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_candidates" ADD CONSTRAINT "import_candidates_import_batch_id_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_candidates" ADD CONSTRAINT "import_candidates_matched_lead_id_leads_id_fk" FOREIGN KEY ("matched_lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_candidates" ADD CONSTRAINT "import_candidates_imported_lead_id_leads_id_fk" FOREIGN KEY ("imported_lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "source_record_lead_idx" ON "business_source_records" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "source_record_batch_idx" ON "business_source_records" USING btree ("import_batch_id");--> statement-breakpoint
CREATE INDEX "import_batch_status_idx" ON "import_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "import_batch_created_idx" ON "import_batches" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "import_candidate_batch_row_unique" ON "import_candidates" USING btree ("import_batch_id","original_row_number");--> statement-breakpoint
CREATE INDEX "import_candidate_batch_idx" ON "import_candidates" USING btree ("import_batch_id");--> statement-breakpoint
CREATE INDEX "import_candidate_status_idx" ON "import_candidates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "import_candidate_domain_idx" ON "import_candidates" USING btree ("normalized_domain");--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_import_batch_id_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_import_batch_idx" ON "leads" USING btree ("import_batch_id");--> statement-breakpoint
CREATE INDEX "lead_normalized_domain_idx" ON "leads" USING btree ("normalized_domain");--> statement-breakpoint
CREATE INDEX "lead_normalized_email_idx" ON "leads" USING btree ("normalized_email");--> statement-breakpoint
CREATE INDEX "lead_normalized_phone_idx" ON "leads" USING btree ("normalized_phone");--> statement-breakpoint
CREATE INDEX "lead_source_identifier_idx" ON "leads" USING btree ("source_identifier");--> statement-breakpoint
CREATE INDEX "suppression_phone_idx" ON "suppression_entries" USING btree ("normalized_phone");--> statement-breakpoint
CREATE INDEX "suppression_source_identifier_idx" ON "suppression_entries" USING btree ("normalized_source_identifier");