CREATE TABLE "client_lead_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_lead_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "client_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"project" varchar(160) DEFAULT '' NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"due_date" date,
	"next_step" varchar(500) DEFAULT '' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_by" varchar(254) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_milestone_status_valid" CHECK ("client_milestones"."status" in ('open','blocked','done')),
	CONSTRAINT "client_milestone_version_positive" CHECK ("client_milestones"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "client_milestones" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "client_workspace_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_by" varchar(254) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_workspace_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "client_workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"status" varchar(20) DEFAULT 'prospect' NOT NULL,
	"contact_name" varchar(120) DEFAULT '' NOT NULL,
	"contact_email" varchar(254) DEFAULT '' NOT NULL,
	"contact_role" varchar(120) DEFAULT '' NOT NULL,
	"website_url" varchar(500) DEFAULT '' NOT NULL,
	"cms" varchar(200) DEFAULT '' NOT NULL,
	"platforms" text DEFAULT '' NOT NULL,
	"vendor_contacts" text DEFAULT '' NOT NULL,
	"access_notes" text DEFAULT '' NOT NULL,
	"current_scope" text DEFAULT '' NOT NULL,
	"support_scope" text DEFAULT '' NOT NULL,
	"support_capacity" varchar(200) DEFAULT '' NOT NULL,
	"support_boundaries" text DEFAULT '' NOT NULL,
	"next_action" varchar(300) DEFAULT '' NOT NULL,
	"next_action_date" date,
	"proposal_status" varchar(20) DEFAULT 'not_started' NOT NULL,
	"proposal_url" varchar(500) DEFAULT '' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_by" varchar(254) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_workspace_status_valid" CHECK ("client_workspaces"."status" in ('prospect','active','paused','archived')),
	CONSTRAINT "client_workspace_proposal_valid" CHECK ("client_workspaces"."proposal_status" in ('not_started','scoping','draft','sent','accepted','declined')),
	CONSTRAINT "client_workspace_version_positive" CHECK ("client_workspaces"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "client_workspaces" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "discovery_briefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_by" varchar(254) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "discovery_status_valid" CHECK ("discovery_briefs"."status" in ('draft','ready','archived')),
	CONSTRAINT "discovery_version_positive" CHECK ("discovery_briefs"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "discovery_briefs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "client_lead_links" ADD CONSTRAINT "client_lead_links_workspace_id_client_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."client_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_lead_links" ADD CONSTRAINT "client_lead_links_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_milestones" ADD CONSTRAINT "client_milestones_workspace_id_client_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."client_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_workspace_notes" ADD CONSTRAINT "client_workspace_notes_workspace_id_client_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."client_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_briefs" ADD CONSTRAINT "discovery_briefs_workspace_id_client_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."client_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "client_lead_link_lead_unique" ON "client_lead_links" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "client_lead_workspace_idx" ON "client_lead_links" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "client_milestone_workspace_idx" ON "client_milestones" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "client_milestone_status_due_idx" ON "client_milestones" USING btree ("status","due_date");--> statement-breakpoint
CREATE INDEX "client_note_workspace_created_idx" ON "client_workspace_notes" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "client_workspace_status_updated_idx" ON "client_workspaces" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "client_workspace_next_action_idx" ON "client_workspaces" USING btree ("next_action_date");--> statement-breakpoint
CREATE INDEX "discovery_workspace_updated_idx" ON "discovery_briefs" USING btree ("workspace_id","updated_at");--> statement-breakpoint
-- Private server-side records: no direct access through the Supabase Data API.
DO $$
DECLARE role_name text; table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['client_workspaces','client_lead_links','client_workspace_notes','discovery_briefs','client_milestones'] LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', table_name);
    FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', table_name,role_name);
      END IF;
    END LOOP;
  END LOOP;
END $$;
