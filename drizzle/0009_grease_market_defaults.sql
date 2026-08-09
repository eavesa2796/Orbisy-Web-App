ALTER TABLE "app_settings" ALTER COLUMN "target_industries" SET DEFAULT '["Grease haulers","Multi-location restaurant operators","Commercial kitchen facility teams"]'::jsonb;--> statement-breakpoint
ALTER TABLE "app_settings" ALTER COLUMN "target_locations" SET DEFAULT '["United States"]'::jsonb;
--> statement-breakpoint
UPDATE "app_settings"
SET "target_industries" = '["Grease haulers","Multi-location restaurant operators","Commercial kitchen facility teams"]'::jsonb,
    "target_locations" = '["United States"]'::jsonb,
    "updated_at" = now()
WHERE "id" = 'default';
