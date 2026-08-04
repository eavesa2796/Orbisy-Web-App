ALTER TABLE "outreach_drafts" ADD COLUMN "audit_run_id" uuid;--> statement-breakpoint
ALTER TABLE "outreach_drafts" ADD COLUMN "brief_version" varchar(40) DEFAULT 'outreach-brief-v1' NOT NULL;--> statement-breakpoint
ALTER TABLE "outreach_drafts" ADD COLUMN "status" varchar(30) DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "outreach_drafts" ADD COLUMN "relevant_context" text;--> statement-breakpoint
ALTER TABLE "outreach_drafts" ADD COLUMN "selected_finding_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "outreach_drafts" ADD COLUMN "why_it_may_matter" text;--> statement-breakpoint
ALTER TABLE "outreach_drafts" ADD COLUMN "suggested_improvement" text;--> statement-breakpoint
ALTER TABLE "outreach_drafts" ADD COLUMN "personalization_notes" text;--> statement-breakpoint
ALTER TABLE "outreach_drafts" ADD COLUMN "recommended_next_action" text;--> statement-breakpoint
ALTER TABLE "outreach_drafts" ADD COLUMN "reviewed_by" varchar(254);--> statement-breakpoint
ALTER TABLE "outreach_drafts" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "outreach_drafts" ADD CONSTRAINT "outreach_drafts_audit_run_id_audit_runs_id_fk" FOREIGN KEY ("audit_run_id") REFERENCES "public"."audit_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "outreach_draft_lead_updated_idx" ON "outreach_drafts" USING btree ("lead_id","updated_at");--> statement-breakpoint
CREATE INDEX "outreach_draft_audit_run_idx" ON "outreach_drafts" USING btree ("audit_run_id");--> statement-breakpoint
ALTER TABLE "outreach_drafts" ADD CONSTRAINT "outreach_draft_status_check" CHECK ("outreach_drafts"."status" in ('draft','approved','stale','blocked'));