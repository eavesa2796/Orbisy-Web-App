ALTER TABLE "association_prospects" ADD COLUMN "manual_contacts" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "association_prospects" ADD COLUMN "outreach_reason" text;