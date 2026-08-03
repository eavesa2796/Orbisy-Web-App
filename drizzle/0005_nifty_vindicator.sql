ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_audit_daily_bound" CHECK ("app_settings"."max_audits_per_day" between 1 and 100);--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_audit_batch_bound" CHECK ("app_settings"."max_audit_jobs_per_worker_run" between 1 and 5);--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_audit_concurrency_bound" CHECK ("app_settings"."max_concurrent_audits" between 1 and 3);--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_audit_pages_bound" CHECK ("app_settings"."max_pages_per_audit" between 1 and 5);--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_audit_links_bound" CHECK ("app_settings"."max_internal_links_checked" between 0 and 50);--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_audit_redirects_bound" CHECK ("app_settings"."audit_max_redirects" between 0 and 10);--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_audit_page_bytes_bound" CHECK ("app_settings"."max_response_bytes_per_page" between 50000 and 2000000);--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_audit_total_bytes_bound" CHECK ("app_settings"."max_total_bytes_per_audit" between "app_settings"."max_response_bytes_per_page" and 8000000);--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_audit_retry_bound" CHECK ("app_settings"."audit_retry_limit" between 1 and 5);--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_audit_score_bound" CHECK ("app_settings"."audit_minimum_business_fit_score" between 0 and 100);--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_audit_retention_bound" CHECK ("app_settings"."audit_retention_days" between 0 and 2555);--> statement-breakpoint
ALTER TABLE "audit_jobs" ADD CONSTRAINT "audit_job_attempt_bound" CHECK ("audit_jobs"."attempt_count" >= 0 and "audit_jobs"."max_attempts" between 1 and 5);--> statement-breakpoint
ALTER TABLE "website_improvement_scores" ADD CONSTRAINT "website_score_total_bound" CHECK ("website_improvement_scores"."total_score" between 0 and 100);--> statement-breakpoint
ALTER TABLE "website_improvement_scores" ADD CONSTRAINT "website_score_coverage_bound" CHECK ("website_improvement_scores"."coverage_percent" between 0 and 100);