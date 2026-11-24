CREATE TABLE "outreach_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"subject" varchar(160) NOT NULL,
	"bodies" jsonb NOT NULL,
	"created_by" varchar(254) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outreach_campaign_status" CHECK ("outreach_campaigns"."status" IN ('draft','active','paused','archived'))
);
--> statement-breakpoint
ALTER TABLE "outreach_campaigns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "outreach_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"recipient_email" varchar(254) NOT NULL,
	"recipient_name" varchar(100) NOT NULL,
	"business_name" varchar(160) NOT NULL,
	"source_url" text NOT NULL,
	"contact_basis" varchar(40) NOT NULL,
	"contact_reason" text NOT NULL,
	"state" varchar(20) DEFAULT 'draft' NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by" varchar(254),
	"first_sent_at" timestamp with time zone,
	"reply_at" timestamp with time zone,
	"pause_reason" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outreach_enrollments_recipient_email_unique" UNIQUE("recipient_email"),
	CONSTRAINT "outreach_enrollment_state" CHECK ("outreach_enrollments"."state" IN ('draft','approved','paused','replied','completed','stopped')),
	CONSTRAINT "outreach_contact_basis" CHECK ("outreach_enrollments"."contact_basis" IN ('permission','prior_relationship','business_introduction'))
);
--> statement-breakpoint
ALTER TABLE "outreach_enrollments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "outreach_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid,
	"message_id" uuid,
	"external_key" varchar(220),
	"kind" varchar(60) NOT NULL,
	"detail" varchar(500) NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outreach_events_external_key_unique" UNIQUE("external_key")
);
--> statement-breakpoint
ALTER TABLE "outreach_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "outreach_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"step" integer NOT NULL,
	"subject" varchar(180) NOT NULL,
	"body" text NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"due_at" timestamp with time zone,
	"first_attempt_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"mime_raw" text,
	"provider_id" varchar(120),
	"thread_id" varchar(120),
	"last_error" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outreach_message_step" CHECK ("outreach_messages"."step" BETWEEN 0 AND 2),
	CONSTRAINT "outreach_message_status" CHECK ("outreach_messages"."status" IN ('draft','approved','sending','sent','failed','uncertain','cancelled'))
);
--> statement-breakpoint
ALTER TABLE "outreach_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "outreach_settings" (
	"id" varchar(20) PRIMARY KEY DEFAULT 'main' NOT NULL,
	"sending_enabled" boolean DEFAULT false NOT NULL,
	"daily_limit" integer DEFAULT 5 NOT NULL,
	"policy_reviewed_at" timestamp with time zone,
	"policy_reviewed_by" varchar(254),
	"gmail_token_ciphertext" text,
	"gmail_cursor" varchar(120),
	"gmail_page_token" text,
	"gmail_synced_at" timestamp with time zone,
	"gmail_error" varchar(300),
	"worker_lease" uuid,
	"worker_lease_until" timestamp with time zone,
	"last_worker_at" timestamp with time zone,
	"last_dispatch_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outreach_daily_limit" CHECK ("outreach_settings"."daily_limit" BETWEEN 1 AND 10)
);
--> statement-breakpoint
ALTER TABLE "outreach_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "outreach_enrollments" ADD CONSTRAINT "outreach_enrollments_campaign_id_outreach_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."outreach_campaigns"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_enrollments" ADD CONSTRAINT "outreach_enrollments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_events" ADD CONSTRAINT "outreach_events_enrollment_id_outreach_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."outreach_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_events" ADD CONSTRAINT "outreach_events_message_id_outreach_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."outreach_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_messages" ADD CONSTRAINT "outreach_messages_enrollment_id_outreach_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."outreach_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "outreach_enrollment_lead_idx" ON "outreach_enrollments" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "outreach_campaign_enrollment_idx" ON "outreach_enrollments" USING btree ("campaign_id","state");--> statement-breakpoint
CREATE INDEX "outreach_event_timeline_idx" ON "outreach_events" USING btree ("enrollment_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "outreach_enrollment_step_unique" ON "outreach_messages" USING btree ("enrollment_id","step");--> statement-breakpoint
CREATE INDEX "outreach_message_due_idx" ON "outreach_messages" USING btree ("status","due_at");--> statement-breakpoint
REVOKE ALL ON TABLE public.outreach_settings, public.outreach_campaigns, public.outreach_enrollments, public.outreach_messages, public.outreach_events FROM PUBLIC;
--> statement-breakpoint
DO $outreach_grants$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
  REVOKE ALL ON TABLE public.outreach_settings, public.outreach_campaigns, public.outreach_enrollments, public.outreach_messages, public.outreach_events FROM anon;
 END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
  REVOKE ALL ON TABLE public.outreach_settings, public.outreach_campaigns, public.outreach_enrollments, public.outreach_messages, public.outreach_events FROM authenticated;
 END IF;
END $outreach_grants$;
