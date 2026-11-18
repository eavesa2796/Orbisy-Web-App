# Inquiry receipt times and private association pricing

## Behavior

- The inquiries/leads list, lead detail header, and dashboard inquiry queue show date and time in America/Chicago, including CST/CDT where applicable.
- Website inquiries use `contact_submissions.submitted_at`. Manual/imported leads show their original `leads.created_at`, labeled Added. Editing a lead does not change either original timestamp. Missing inquiry dates are not replaced with a misleading lead-update time.
- The private Pricing page presents ten proposed scopes covering discovery, websites, member/staff functionality, integrations, care, bounded monthly development, hourly support, and add-ons.
- Dollar ranges are owner-review proposals based on the stated workload assumptions. They are not confirmed Orbisy rates, market statistics, public prices, or contractual commitments.
- “Add association pricing drafts” persists editable draft entries. Repeating it does not overwrite existing template entries. Fixed amounts remain unset in new drafts. Choose a fixed base amount OR a minimum/maximum range, following the selected billing basis.
- Earlier standard templates and advertising/SEO entries remain under Legacy entries. Nothing is automatically deleted, archived, or repriced. Custom entries remain accessible. Draft/Active/Archived status is private; Active means approved for internal quoting.
- Public pricing, lead submission, authentication, consent, and notifications are unchanged.

## Migration and release order

1. Identify the intended production database using the existing target-inspection procedure. Review existing migration history and record counts before applying any SQL.
2. Apply the reviewed `0011_pricing_ranges.sql` through the established Drizzle migration process, preserving the deployment's migration-history convention. It adds two nullable integer columns and a range check to `pricing_entries`; existing amounts, statuses, notes, rows, grants, and RLS remain intact. There is no data seed in this migration.
3. Deploy the code after the migration. Until the columns exist, the Pricing page displays a database-setup notice rather than suggesting a save succeeded.
4. Sign in as administrator, open Pricing, and add the association drafts once. Review each scope/range, edit as needed, and explicitly mark approved entries Active. Review old entries in the Legacy view; archive individually when appropriate.
5. Verify a range edit survives refresh, invalid bounds are rejected, legacy rates remain unchanged, anonymous access is denied, and inquiry receipt times match the original saved records.

Rolling code back leaves the additive columns in place safely; do not drop columns containing newly entered pricing data.

## Review preview

`/preview/admin-catalog` is available only on preview/development deployments and returns 404 in production. It uses fictional lead data and the proposed pricing reference. It reads no database, has no editable pricing form, and saves no records. The authenticated catalog and persisted edits must be checked separately after migration with an administrator session.
