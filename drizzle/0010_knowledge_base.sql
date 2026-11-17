CREATE TABLE "knowledge_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(160) NOT NULL,
	"category" varchar(30) DEFAULT 'websites' NOT NULL,
	"summary" varchar(350) DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"internal_notes" text DEFAULT '' NOT NULL,
	"reviewed_on" date,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"published" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_by" varchar(254) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_article_status_valid" CHECK ("knowledge_articles"."status" in ('draft','published','archived')),
	CONSTRAINT "knowledge_article_category_valid" CHECK ("knowledge_articles"."category" in ('websites','members','integrations','process')),
	CONSTRAINT "knowledge_article_version_positive" CHECK ("knowledge_articles"."version" > 0),
	CONSTRAINT "knowledge_article_published_required" CHECK ("knowledge_articles"."status" <> 'published' or "knowledge_articles"."published" is not null)
);
--> statement-breakpoint
ALTER TABLE "knowledge_articles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_article_slug_unique" ON "knowledge_articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "knowledge_article_status_updated_idx" ON "knowledge_articles" USING btree ("status","updated_at");
--> statement-breakpoint
-- No direct Data API access to working copies or published JSON. Public pages use a server-only projection.
REVOKE ALL ON TABLE public.knowledge_articles FROM PUBLIC;
--> statement-breakpoint
DO $$ DECLARE role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN
      EXECUTE format('REVOKE ALL ON TABLE public.knowledge_articles FROM %I',role_name);
    END IF;
  END LOOP;
END $$;
