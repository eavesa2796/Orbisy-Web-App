CREATE TYPE "public"."association_sales_stage" AS ENUM('needs_review', 'ready_to_contact', 'contacted', 'follow_up', 'skip');--> statement-breakpoint
ALTER TABLE "association_prospects" ADD COLUMN "sales_stage" "association_sales_stage" DEFAULT 'needs_review' NOT NULL;--> statement-breakpoint
ALTER TABLE "association_prospects" ADD COLUMN "sales_next_action" varchar(300);--> statement-breakpoint
ALTER TABLE "association_prospects" ADD COLUMN "sales_next_action_date" date;--> statement-breakpoint
ALTER TABLE "association_prospects" ADD COLUMN "sales_last_interaction" varchar(600);