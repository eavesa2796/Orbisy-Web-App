# Orbisy — Phase Two

Orbisy is Anthony Eaves’s Chicago-based software-development business. This
MVP combines a public service website, secure inbound forms, a
single-administrator lead workspace, manual outreach preparation,
privacy-conscious first-party analytics, and an administrator-reviewed
business-import workflow.

No automated outreach, website auditing, lead scoring, public reports, or bulk
email exists in this phase.

## Architecture

- Next.js 16 App Router, React 19, TypeScript, and plain CSS
- PostgreSQL with Drizzle ORM and versioned SQL migrations
- Supabase Auth for one allowlisted administrator
- Route Handlers for public submissions and anonymous analytics
- Database-backed rate limits suitable for a single-region MVP
- Optional Cloudflare Turnstile and optional Resend inbound notifications
- Bounded CSV parsing, deterministic normalization, source attribution,
  duplicate review, and suppression checks

Public forms create both an immutable contact submission and a prioritized
lead. Admin authorization is enforced in every protected page and Server
Action using Supabase’s server-validated `getUser()` result plus an
`ADMIN_EMAIL` allowlist. The `/admin-portal` URL is deliberately absent from
public navigation and the sitemap, but the URL itself is not considered a
security boundary.

## Local setup

Requirements: Node.js 20.9 or newer, npm, and PostgreSQL.

```bash
npm install
cp .env.example .env.local
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`. Visit `/admin-portal` directly for administrator
sign-in.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public Supabase browser key |
| `ADMIN_EMAIL` | Yes | Sole authorized administrator; use `anthonyeaves33@gmail.com` |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical origin, such as `https://orbisy.com` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Production | Public Turnstile widget key |
| `TURNSTILE_SECRET_KEY` | Production | Server-side Turnstile verification |
| `RATE_LIMIT_SECRET` | Production | Secret salt used to hash request IPs |
| `ANALYTICS_ENABLED` | No | Set to `false` to disable event collection |
| `ANALYTICS_RETENTION_DAYS` | No | Retention period; defaults to 90, capped at 365 |
| `RESEND_API_KEY` | No | Optional notification for new inbound forms only |
| `RESEND_FROM_EMAIL` | With Resend | Verified sender |
| `NOTIFICATION_EMAIL` | No | Notification destination; defaults to `info@orbisy.com` |

Never commit `.env.local` or production secrets.

## PostgreSQL and migrations

Create a PostgreSQL database locally or with a managed provider, set
`DATABASE_URL`, then run:

```bash
npm run db:generate  # after changing src/lib/db/schema.ts
npm run db:migrate
```

The generated migration is in `drizzle/`. Production migrations should run as
a controlled release step, not from a public request.

Phase Two adds migrations `0001_parallel_vampiro.sql` and
`0002_bouncy_madame_masque.sql`. They add tables, enum types, indexes, foreign
keys, and nullable/defaulted columns without dropping or rewriting Phase One
records. The migration test applies Phase One, inserts a fixture lead, applies
Phase Two, and verifies the original record remains.

Before a production migration:

1. Confirm the provider backup or point-in-time recovery setting.
2. Run `npm test` and `npm run db:migrate` against a development database.
3. Record current row counts for `leads`, `contact_submissions`, and
   `analytics_events`.
4. Run the migration once in a controlled release step.
5. Verify old row counts and the new import tables.

Recovery guidance: do not manually edit the Drizzle journal. If a migration
fails, stop application promotion, preserve the database error, and restore
from the provider backup when a partial change cannot be safely completed.

## Supabase authentication

1. Create a Supabase project and enable email/password authentication.
2. Create the administrator user `anthonyeaves33@gmail.com` in the Supabase
   dashboard. Do not enable public registration in this application.
3. Add the site origin and
   `https://your-domain.example/auth/callback?next=/auth/reset-password` to the
   permitted redirect URLs.
4. Configure the three Supabase/admin environment variables above.
5. Keep Supabase’s built-in authentication rate limits enabled.

Only the exact normalized `ADMIN_EMAIL` can access protected pages. A valid
Supabase session for any other account is rejected.

## Forms, spam protection, and notifications

Both public forms have browser validation and authoritative Zod validation on
the server. They use a honeypot, idempotency token, request-size limit,
database-backed rate limit, and Turnstile in production.

Without Resend, submissions are still safely stored and shown in the admin
portal; notification failure never discards a submission. Resend is
inbound-notification-only. There is no outbound prospect email delivery.

## Analytics

Orbisy records an allowlisted set of first-party aggregate events: page views,
CTA clicks, section views, FAQ opens, scroll depth, form views/starts/errors,
and successful submissions. The client uses a tab-scoped anonymous UUID.

The system does not store full IP addresses, names, email addresses, cookies,
fingerprints, cross-site identifiers, keystrokes, heatmaps, or session replay.
Global Privacy Control, Do Not Track, and the Privacy Policy opt-out are
honored. Old events are pruned as new events arrive according to
`ANALYTICS_RETENTION_DAYS`.

## Phase Two lead imports

The administrator can open `/admin-portal/imports`, download a template, select
a permitted CSV, map its columns, and create a preview. The preview stores
original source values separately from normalized comparison values. Ready
rows are imported only after explicit confirmation; invalid, uncertain,
duplicate, and suppressed rows remain out of the active pipeline.

Default limits are 1 MB and 500 data rows. Both are stored in PostgreSQL and
can be adjusted conservatively in Settings. Files beyond the configured
synchronous limit are rejected rather than attempted in a normal request.

Supported mappings:

- Business name (required)
- Category and industry
- Street address, city, state, postal code, and general location
- Website URL
- Public business email and phone
- Contact name when legitimately available
- Source name, URL, identifier, and date discovered

The CSV parser supports quoted fields and rejects malformed structures, null
bytes, unsupported UTF-8, oversized records, excessive rows, unsupported file
types, and missing business-name mappings. Rejected-row downloads prefix
formula-like values before CSV encoding.

Duplicate classifications are explainable: new record, exact duplicate, likely
duplicate, possible duplicate, existing suppressed, or manual review required.
Exact source identifiers, domains, public emails, and phone numbers are checked
first. Similar business-name/location matches require an administrator
decision. Filling an existing lead only populates missing values; it does not
replace higher-quality existing information.

Suppression checks cover normalized email, domain, phone, source identifier,
and lead-level suppression. Standalone suppression entries can be created at
`/admin-portal/suppressions`. They do not automatically expire.

Provider adapters currently exist only for manual entry and CSV. A future
licensed provider must implement the same validation, normalization, source
identifier, and attribution contract. Scraping Google, LinkedIn, Yelp,
Facebook, or prohibited directories is outside the supported workflow.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
# or all at once
npm run verify
```

Tests cover submission validation, the analytics allowlist, CSV parsing,
normalization, export formula-injection protection, administrator email policy,
import confirmation policy, suppression matching, and additive migration
behavior. Before release, manually test signed-out and signed-in import routes,
column mapping, confirmation, review decisions, and downloads against a
development database.

## Deployment guidance

Vercel is the simplest host for this Next.js application but is not required;
any Node.js 20 host that supports Next.js and HTTPS works. A practical starter
setup is:

- Vercel Hobby for the application (review its current commercial-use terms)
- Supabase free tier for authentication
- Neon or Supabase Postgres free tier for the database
- Cloudflare Turnstile for spam protection
- Resend free tier only if inbound notification emails are desired

Free tiers and provider terms change. Confirm current quotas, commercial-use
rules, data regions, backups, and overage behavior before launch. Add the
domain only after the preview environment passes verification.

## Security and operational considerations

- Security headers and a restrictive Content Security Policy are configured.
- Admin routes and auth utility routes use `noindex`; robots and the sitemap
  exclude private areas and APIs.
- Rate limits are database-backed. Multi-region production should move them to
  an atomic globally shared store such as managed Redis.
- PostgreSQL access should use TLS, least-privilege credentials, provider
  backups, and tested restores.
- Privacy Policy and Terms are drafts requiring owner and legal review.
- Consent language covers responding to an inbound request, not marketing
  subscriptions or automated outreach.
- Monitor form abuse, auth logs, database capacity, and notification failures.

## Current limitations

- One administrator only
- CSV uploads are bounded and processed synchronously; no original file blob is retained
- No background job worker
- No licensed data-provider integration, website audits, scores, or reports
- No automatic email outreach or email sequencing
- No analytics session replay or individual visitor profiles
- Portfolio cards and links are explicitly labeled placeholders
- Possible-duplicate thresholds are stored for future scoring refinement; the
  MVP uses deterministic exact and name/location rules
- Import correction is performed by fixing and re-uploading rejected rows

## Recommended next step

Run both Phase Two migrations against a separate development database, complete
the administrator import acceptance test, back up production, and request
explicit authorization before applying migrations or deploying.
