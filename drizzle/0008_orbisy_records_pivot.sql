CREATE TYPE "public"."prospect_type" AS ENUM('grease_hauler', 'restaurant_operator', 'facility_team', 'other');--> statement-breakpoint
ALTER TYPE "public"."submission_type" ADD VALUE 'hauler_request';--> statement-breakpoint
ALTER TYPE "public"."submission_type" ADD VALUE 'restaurant_request';--> statement-breakpoint
ALTER TYPE "public"."submission_type" ADD VALUE 'general_request';--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD COLUMN "phone" varchar(40);--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD COLUMN "role" varchar(100);--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD COLUMN "audience" varchar(40);--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD COLUMN "service_area" varchar(200);--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD COLUMN "location_count" varchar(40);--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD COLUMN "current_record_process" varchar(160);--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD COLUMN "primary_challenge" text;--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD COLUMN "pilot_interest" varchar(120);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "prospect_type" "prospect_type" DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "service_territory" varchar(200);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "account_count_estimate" varchar(40);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "current_record_process" varchar(160);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "primary_challenge" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "pilot_interest" varchar(120);