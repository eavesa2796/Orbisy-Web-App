CREATE TYPE "public"."billing_basis" AS ENUM('one_time', 'monthly', 'hourly', 'per_unit', 'custom');--> statement-breakpoint
CREATE TYPE "public"."pricing_category" AS ENUM('website', 'google_ads', 'local_seo', 'development', 'maintenance', 'add_on', 'package');--> statement-breakpoint
CREATE TYPE "public"."pricing_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TABLE "pricing_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_key" varchar(80),
	"name" varchar(160) NOT NULL,
	"category" "pricing_category" NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"deliverables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"billing_basis" "billing_basis" DEFAULT 'one_time' NOT NULL,
	"amount_cents" integer,
	"setup_fee_cents" integer,
	"recurring_fee_cents" integer,
	"recurring_interval" varchar(80),
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"internal_notes" text DEFAULT '' NOT NULL,
	"status" "pricing_status" DEFAULT 'draft' NOT NULL,
	"updated_by" varchar(254) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pricing_entries_template_key_unique" UNIQUE("template_key"),
	CONSTRAINT "pricing_amount_nonnegative" CHECK ("pricing_entries"."amount_cents" >= 0),
	CONSTRAINT "pricing_setup_nonnegative" CHECK ("pricing_entries"."setup_fee_cents" >= 0),
	CONSTRAINT "pricing_recurring_nonnegative" CHECK ("pricing_entries"."recurring_fee_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "submission_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"lease_token" uuid,
	"last_attempt_at" timestamp with time zone,
	"last_error" varchar(120),
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submission_notifications_submission_id_unique" UNIQUE("submission_id"),
	CONSTRAINT "notification_status_valid" CHECK ("submission_notifications"."status" in ('pending','sending','sent','failed','not_configured')),
	CONSTRAINT "notification_attempts_nonnegative" CHECK ("submission_notifications"."attempts" >= 0)
);
--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD COLUMN "attribution" jsonb;--> statement-breakpoint
ALTER TABLE "submission_notifications" ADD CONSTRAINT "submission_notifications_submission_id_contact_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."contact_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pricing_status_category_idx" ON "pricing_entries" USING btree ("status","category");--> statement-breakpoint
CREATE INDEX "notification_status_idx" ON "submission_notifications" USING btree ("status");
--> statement-breakpoint
ALTER TABLE "pricing_entries" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "submission_notifications" ENABLE ROW LEVEL SECURITY;
