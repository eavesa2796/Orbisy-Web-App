# Agency refresh: review and configuration

The review branch is `agency-brand-refresh`, draft PR #11. Production launch is a separate step. The archived records-service pages and existing administrator account, leads, imports, preflight/audits, suppression controls, analytics, and manual outreach features remain in place.

## Public pages and portfolio

- `/`: local service business offer, buying engagements, selected work, Anthony, process, consultation.
- `/web-design`, `/google-ads`, `/local-seo`, `/custom-development`: deliverables, onboarding, client inputs, pricing basis, questions, service-prefilled inquiry.
- `/towing-marketing`: operation-specific scope and the three related service engagements.
- `/work`: Rescue Battery Shop and Rescue Tow Truck, with real screenshots captured October 3, 2026. The owner confirmed complete website builds for both during this review. Rescue Tow Truck currently displays a Key Design Websites footer credit; no exclusive agency credit or marketing performance claim has been added. Descriptions concern the observed visitor experience, not documented outcomes.
- `/campaigns/towing-websites` and `/campaigns/local-google-ads`: focused offer pages backed by an explicit allowlist in `src/lib/campaigns.ts`. Unknown offers return 404. Campaign pages are noindex and omitted from the sitemap until advertising plans are approved.

## Database target and migration

Migration `drizzle/0008_agency_pricing_notifications.sql` is additive: it adds nullable inquiry attribution plus private pricing and notification tables. It enables RLS with no anonymous policies on both new tables. It neither alters existing lead statuses nor deletes/backfills existing inquiries. Legacy inquiries remain visible and are labeled as predating notification tracking.

The Orbisy production target was migrated on October 6, 2026 UTC using the guarded release below. The local workspace has no DATABASE_URL, and Preview remains a separate, unconfigured target. Do not run the one-time production release again.

Before applying migrations:

1. Configure a named Preview database or isolated branch, not a shared production database. Point the review deployment and your migration environment at that same target.
2. Load DATABASE_URL securely in `.env.local` (never commit it), then run `npm run db:target`. This read-only script prints the host, database, role, and a target fingerprint without a password. Confirm the environment and target in the database provider's dashboard.
3. Verify the existing migration journal and current schema. The new migration follows 0007; an older target will also require its outstanding migrations. Take the appropriate provider backup/snapshot before migrating a database with real records.
4. Once the exact target is confirmed and migration is authorized, run `npm run db:migrate`. Do not use `drizzle-kit push`, drop tables, or reset records. Use a privileged server database connection: browser/anonymous Supabase access is deliberately denied by RLS.
5. Redeploy Preview, submit a labeled test inquiry, inspect its lead, and exercise Pricing under the allowlisted administrator identity.

## Preview configuration

Check Preview scope independently of Production scope. Set the existing DATABASE_URL, RATE_LIMIT_SECRET, ADMIN_EMAIL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, ANALYTICS_ENABLED, ANALYTICS_RETENTION_DAYS, and NEXT_PUBLIC_SITE_URL as appropriate for this environment. Include the actual preview hostname in the Turnstile widget's allowed hostnames. Scope changes require a new deployment; public Next.js values are included at build time.

Keep the existing administrator identity and ADMIN_EMAIL allowlist. There is no new sign-up system or replacement authentication provider.

Notifications require **all three** RESEND_API_KEY, RESEND_FROM_EMAIL (a verified sender), and NOTIFICATION_EMAIL (the owner's notification recipient). Missing mail configuration does not prevent a saved inquiry. It yields `not_configured` in the private Notifications page and lead detail. No fallback recipient is inferred.

## Inquiry and notification behavior

Validation, privacy acknowledgment, honeypot, Turnstile verification, and database rate limiting remain server-side. A database transaction saves the submission, lead, and pending notification together before acknowledging success. A stable browser submission token and database unique constraint make retries idempotent; the success analytics event fires only for a saved, nonduplicate response.

The notification is delivered in Next.js `after()`, which keeps the hosted invocation alive. Missing configuration, HTTP failure, and timeout are persisted with bounded error descriptions and attempts. The admin can retry pending or failed notifications. An atomic lease prevents concurrent sends; retry cooldown is one minute and interrupted leases expire after ten minutes. A stable Resend idempotency key covers its 24-hour deduplication window. Review provider logs before retrying ambiguous old timeouts. `sent` means the provider accepted the email; inbox delivery is not independently confirmed. There is no scheduled retry worker in this revision.

The Notifications page prioritizes records needing attention and displays up to 100; every lead detail can display and retry its own notification. Old inquiries are not automatically re-emailed.

Optional attribution preserves first landing path and bounded UTM labels across public navigation within a browser session, and records the submission path. It stores only referring hostnames, never full query strings or click IDs, and never attaches analytics session identifiers to a lead. Existing analytics opt-out, DNT, GPC, and server-side ANALYTICS_ENABLED=false suppress inquiry attribution. Optional analytics failures do not interrupt saving. The revised draft Privacy Policy describes this behavior; owner/legal review remains a prelaunch task already present in this repository.

## Private pricing

`/admin-portal/pricing` supports create/edit, deliverables, USD base/setup/recurring amounts, billing basis/recurring interval, internal notes, categories, and draft/active/archived status. All reads and actions enforce the existing server administrator check. Pricing changes are recorded in existing administrator activity logs. No public pricing endpoint, sitemap entry, or indexing permission is added.

“Add standard services” idempotently inserts 15 draft templates with **all amounts null**. Editing or archiving a template is preserved on later template additions. Blank amounts mean unset, not zero. Advertising spend is separate from management fees.

The separate owner-review pricing draft lives in the private page and `src/lib/pricing-draft.ts`. It is a set of proposed starting ranges, not confirmed rates, researched market benchmarks, or a budget-range-derived catalog. No proposal values are automatically copied into the database. Confirm workload, margin, support obligations, and each rate before entering it into the catalog.

Google Ads conversion tags and campaign launch require the account IDs, offers, budget, and consent configuration; this revision adds the landing-page structure and saved-inquiry event but does not activate advertising.

## Production preflight, October 6, 2026 UTC

The user authorized a production launch. The connected Supabase project is **Orbisy**, ref `xjmoroanmpnipntmadcb`, main / Production, in the Orbisy organization. The administrator `anthonyeaves33@gmail.com` exists. Preflight found seven leads and seven inquiries. The authorized guarded production migration subsequently completed successfully.

GitHub main still ends at migration 0007 and the agency branch adds 0008. Their existing migration files match the inspected local files byte for byte. Before the release, the live Drizzle journal contained only 0000–0002, whose hashes and timestamps match GitHub. A 624-object catalog comparison confirms the complete 0007 schema: column types/nullability/defaults, enums, validated constraints, index definitions and validity, tables, RLS and policies. The only accepted difference is stronger existing RLS on 18 tables; all 27 public application tables have RLS enabled and no policies. PostgreSQL-version-specific NOT NULL constraint objects are ignored because column nullability is compared directly.

**Historical release preparation:** the ordinary migration command would have attempted already-existing migrations 0003–0007. The following tools prepared and tested the guarded release that has now been applied:

```bash
mkdir -p release-check
node scripts/prepare-agency-production-migration.mjs release-check/production-release.sql
node scripts/verify-agency-production-migration.mjs release-check/production-release.sql
```

The generator never connects to a database. The application target was confirmed through its timestamp-matched production rate-limit write before the release was executed. Future releases must independently identify their target. The release takes short table locks, rechecks the exact catalog and three existing journal entries, copies the 27 application tables and original journal into a restricted `orbisy_release_20261006` schema, applies the unchanged additive 0008 migration, and records verified migrations 0003–0008 in Drizzle. It checks every copied row and row count before committing. Any mismatch, duplicate run, lock timeout, or SQL failure aborts the transaction. It does not alter administrator credentials or worker settings.

The private recovery copy is on the same database and depends on its existing types. It is a row-preservation checkpoint for this additive release, **not an independent provider/disaster-recovery backup**. Supabase Free currently provides no scheduled backups. Do not delete this checkpoint as part of release verification. If recovery is needed, retain the exact original schema and inspect the checkpoint with a privileged connection; never automatically reset tables or remove new production inquiries. Local regression checks verify successful preservation, inaccessible recovery copies, repeat rejection, and atomic rejection of unexpected columns and changed migration hashes.

Resend's existing `orbisy.com` domain is verified and ready to send. Production `NOTIFICATION_EMAIL=info@orbisy.com` and `RESEND_FROM_EMAIL=Orbisy <info@orbisy.com>` were added. `RESEND_API_KEY` still needs user-controlled credential entry; the existing Outreach key was not changed. Existing Production configuration remains in place, and Preview is still configured separately.

The current production form rejected a labeled test at spam verification. No test inquiry or lead was saved. Its timestamp-matched rate-limit write identified the connected production database. The widget and Cloudflare script are present; the reason this browser did not obtain verification is unresolved. Do not disable Turnstile or bypass validation to complete a test. The new agency form already handles blank optional budget values, which the legacy form rejected. Merge/deployment remains pending user-controlled RESEND_API_KEY entry. Saved inquiry, authenticated pricing editing, and live email delivery still require production verification.


## Completed production migration

Supabase migration `20261006031230`, `agency_catalog_notifications_with_verified_drizzle_baseline`, succeeded. Drizzle now records all nine migrations 0000–0008. The complete 672-object final catalog comparison found no unexpected differences, allowing the stronger existing RLS. Seven leads, seven inquiries, and the administrator account are preserved. All prior application row contents and counts were checked within the transaction before commit.

The restricted `orbisy_release_20261006` checkpoint contains all 27 original application tables and the original journal. Anonymous and authenticated roles have no schema access. The new Pricing and Notifications tables are empty, have RLS enabled, and expose no public policies. No confirmed prices have been entered. The agency branch has not yet been merged or deployed to production.
