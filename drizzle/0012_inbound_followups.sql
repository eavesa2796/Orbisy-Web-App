CREATE TABLE "followup_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"recipient_email" varchar(254) NOT NULL,
	"recipient_name" varchar(100) NOT NULL,
	"state" varchar(30) DEFAULT 'needs_response' NOT NULL,
	"personal_response_at" timestamp with time zone,
	"reply_at" timestamp with time zone,
	"pause_reason" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "followup_conversations_submission_id_unique" UNIQUE("submission_id"),
	CONSTRAINT "followup_conversations_lead_id_unique" UNIQUE("lead_id"),
	CONSTRAINT "followup_conversation_state" CHECK ("followup_conversations"."state" in ('needs_response','waiting_reply','paused','closed'))
);
--> statement-breakpoint
ALTER TABLE "followup_conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "followup_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid,
	"message_id" uuid,
	"external_key" varchar(220),
	"provider_email_id" varchar(120),
	"kind" varchar(60) NOT NULL,
	"detail" varchar(500) NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "followup_events_external_key_unique" UNIQUE("external_key")
);
--> statement-breakpoint
ALTER TABLE "followup_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "followup_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid,
	"dedup_key" varchar(180) NOT NULL,
	"kind" varchar(30) NOT NULL,
	"recipient_email" varchar(254) NOT NULL,
	"subject" varchar(180) NOT NULL,
	"body" text NOT NULL,
	"delivery_payload" jsonb,
	"status" varchar(30) DEFAULT 'draft' NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by" varchar(254),
	"provider_id" varchar(120),
	"attempts" integer DEFAULT 0 NOT NULL,
	"first_attempt_at" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	"next_attempt_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"lease_token" uuid,
	"last_error" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "followup_messages_dedup_key_unique" UNIQUE("dedup_key"),
	CONSTRAINT "followup_messages_provider_id_unique" UNIQUE("provider_id"),
	CONSTRAINT "followup_message_state" CHECK ("followup_messages"."status" in ('draft','approved','sending','accepted','delivered','failed','uncertain','cancelled')),
	CONSTRAINT "followup_message_kind" CHECK ("followup_messages"."kind" in ('acknowledgment','followup_one','followup_two','digest'))
);
--> statement-breakpoint
ALTER TABLE "followup_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "followup_settings" (
	"id" varchar(20) PRIMARY KEY DEFAULT 'main' NOT NULL,
	"enrollment_enabled" boolean DEFAULT false NOT NULL,
	"sending_enabled" boolean DEFAULT false NOT NULL,
	"auto_acknowledge" boolean DEFAULT false NOT NULL,
	"activated_at" timestamp with time zone,
	"templates" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"digest_enabled" boolean DEFAULT false NOT NULL,
	"digest_hour" integer DEFAULT 18 NOT NULL,
	"gmail_token_ciphertext" text,
	"gmail_cursor" varchar(120),
	"gmail_page_token" text,
	"gmail_synced_at" timestamp with time zone,
	"gmail_error" varchar(300),
	"worker_lease" uuid,
	"worker_lease_until" timestamp with time zone,
	"last_worker_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "followup_digest_hour" CHECK ("followup_settings"."digest_hour" >= 5 AND "followup_settings"."digest_hour" < 21)
);
--> statement-breakpoint
ALTER TABLE "followup_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "followup_conversations" ADD CONSTRAINT "followup_conversations_submission_id_contact_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."contact_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followup_conversations" ADD CONSTRAINT "followup_conversations_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followup_events" ADD CONSTRAINT "followup_events_conversation_id_followup_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."followup_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followup_events" ADD CONSTRAINT "followup_events_message_id_followup_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."followup_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followup_messages" ADD CONSTRAINT "followup_messages_conversation_id_followup_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."followup_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "followup_open_email_unique" ON "followup_conversations" USING btree ("recipient_email") WHERE "followup_conversations"."state" <> 'closed';--> statement-breakpoint
CREATE INDEX "followup_conversation_state_idx" ON "followup_conversations" USING btree ("state","updated_at");--> statement-breakpoint
CREATE INDEX "followup_event_timeline_idx" ON "followup_events" USING btree ("conversation_id","occurred_at");--> statement-breakpoint
CREATE INDEX "followup_due_idx" ON "followup_messages" USING btree ("status","due_at");
--> statement-breakpoint
REVOKE ALL ON TABLE public.followup_settings, public.followup_conversations, public.followup_messages, public.followup_events FROM PUBLIC;
--> statement-breakpoint
DO $followup_grants$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
  REVOKE ALL ON TABLE public.followup_settings, public.followup_conversations, public.followup_messages, public.followup_events FROM anon;
 END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
  REVOKE ALL ON TABLE public.followup_settings, public.followup_conversations, public.followup_messages, public.followup_events FROM authenticated;
 END IF;
END $followup_grants$;
