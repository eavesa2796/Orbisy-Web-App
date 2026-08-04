# Orbisy — Phase Five

Orbisy is Anthony Eaves’s Chicago-based software-development business. This
MVP combines a public service website, secure inbound forms, a
single-administrator lead workspace, manual outreach preparation,
privacy-conscious first-party analytics, and an administrator-reviewed
business-import workflow.

Phase Five turns administrator-approved audit evidence into private outreach
briefs for manual use, strengthens pipeline history, adds safe dashboard search
for businesses already stored in Orbisy, and applies the approved Orbisy brand
assets across the public site and administrator authentication experience. It
does not discover external businesses, generate public reports, send email,
calculate revenue loss, or run automatically.

## Phase Five architecture

An outreach brief is available only for an inbound request or a lead whose
latest completed audit is explicitly marked Phase Five-ready. Audit-based
briefs require one or two findings verified in that exact audit run. The brief
stores the audit reference, selected finding IDs, reviewed wording, context,
qualified potential-impact language, a suggested improvement, personalization
notes, recommended next action, subject, body, review identity, and status.

Saving a draft never sends or publishes it. Explicit administrator approval is
required before copy controls appear. Approval moves an appropriate lead to
`contact_planned` and records a pipeline event; separately recording manual
contact moves it to `contacted` and records both the attempt and status history.
Changing reviewed audit evidence, reopening the audit, or suppressing the lead
invalidates or blocks the brief. Unsupported monetary and revenue-loss claims
are rejected server-side.

The dashboard company search delegates to the existing server-authorized lead
search and covers saved business names, domains, contacts, phones, cities, and
source identifiers. It is not a discovery engine and does not scrape external
sites. Manual entry and permitted CSV import remain the only business-data
sources.

Brand files use Next.js file-based favicon, application-icon, Apple-icon, and
manifest conventions. The public header/footer, administrator shell, sign-in,
and password-reset experience use the approved Orbisy logo kit. Administrator
authorization, route hiding, noindex behavior, and authentication flow are
unchanged.

## Phase Four architecture

An administrator explicitly queues a Phase Three-eligible or administrator-
approved lead. Separate PostgreSQL audit jobs are atomically claimed with a
bounded lease and concurrency lock. Suppression, exact duplicates, existing
relationships, operating switches, daily limits, and re-audit intervals are
checked before work; suppression is checked again before network activity and
between selected pages.

The worker inspects the final Phase Three homepage and at most a conservative
number of useful same-registrable-domain pages. Page discovery favors contact,
services, about, and booking pages. Every initial URL, discovered link, and
redirect passes the Phase Three DNS validation, address pinning, SSRF blocking,
timeout, redirect, content-type, and streamed byte-limit pipeline. Robots rules
are applied by path. Remote JavaScript is never executed, forms are never
submitted, and full response bodies are not stored.

Independently testable analyzers record objective HTML indicators for
reliability, mobile foundations, contact paths, technical SEO, accessibility
fundamentals, links, and images. Findings store bounded evidence, severity,
confidence, source, analyzer version, affected URL, and verification history.
They are informational—not penetration testing, SEO forecasting, WCAG/legal
certification, or a guarantee of business results.

`website-improvement-v1` remains separate from Business Fit. Each awarded point
maps to a fixed finding rule and retained finding ID, with category caps of 20
mobile, 20 conversion, 15 performance, 15 SEO, 10 accessibility, 10 reliability,
and 10 administrator-supported manual opportunity. Missing or unavailable
checks add no points. Rejected findings are excluded only from a new reviewed
score; earlier scores are preserved.

Audit Confidence is separately versioned from the opportunity score and records
analyzer coverage, page coverage, optional provider availability, failures,
conflicts, and manual-review coverage. Phase Five readiness requires a completed
run, the configured confidence level, no pending findings, no suppression or
blocking error, and explicit administrator review completion.

### Local deep-audit worker

After applying migrations to a development database, set a development-only
`DEEP_AUDIT_WORKER_SECRET` of at least 24 random characters. Enable both Phase
Four switches in the local Settings page, queue one controlled eligible lead,
and invoke:

```bash
curl -X POST http://localhost:3000/api/internal/deep-audit-worker \
  -H "Authorization: Bearer $DEEP_AUDIT_WORKER_SECRET"
```

The endpoint URL is not a security boundary. No Vercel Cron or other production
scheduler is included. Keep both production deep-audit switches off until a
separate controlled rollout is approved.

## Phase Three architecture

Administrators queue a bounded set of non-suppressed leads. PostgreSQL stores
idempotent jobs and workers claim them atomically with `FOR UPDATE SKIP LOCKED`.
A partial unique index prevents multiple active jobs for one lead/version.
Retries are bounded with backoff, and the global/worker kill switches plus
suppression are rechecked before network activity.

The server-only transport accepts only HTTP(S), resolves DNS before connecting,
rejects mixed or prohibited answers, and pins a validated address through the
request lookup callback. It blocks loopback, private, link-local, carrier-grade
NAT, multicast, unspecified, reserved/documentation, IPv4-mapped IPv6, and
metadata destinations. Every redirect is parsed, resolved, revalidated, and
pinned. Byte limits apply while streaming; redirect, connection, and overall
timeouts are bounded. Remote code is never executed and response bodies are
not stored.

`robots.txt` uses the same controls. An explicit homepage disallow stops the
homepage request; missing or unreachable robots data is recorded truthfully.
Only robots policy and the homepage are checked—there is no broad crawl.

Business Fit `business-fit-v1` weights target industry 35, target location 30,
public business contact path 15, and current-service suitability 20. Gates,
inputs, factors, points, versions, and explanations are retained. Suppression,
exact duplicates, and existing relationships are gates rather than hidden
deductions. Audit eligibility is a separate decision that permits an explicit
Phase Four queue action; it never starts a deep audit automatically.

### Local worker execution

After applying migrations to a development database, configure a strong
`PREFLIGHT_WORKER_SECRET` and enable both switches in Settings:

```bash
curl -X POST http://localhost:3000/api/internal/preflight-worker \
  -H "Authorization: Bearer $PREFLIGHT_WORKER_SECRET"
```

Use a trusted scheduler only. The secret is compared using constant-time
digests; the route URL is not a security boundary. Production scheduling is
intentionally not enabled.

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
| `PREFLIGHT_WORKER_SECRET` | For workers | Dedicated secret of at least 24 random characters |
| `ORBISY_FETCHER_USER_AGENT` | No | Identifiable fetcher user-agent override |
| `DEEP_AUDIT_WORKER_SECRET` | For Phase 4 workers | Separate secret of at least 24 random characters |
| `PAGESPEED_API_KEY` | No | Optional Google PageSpeed provider; absence is recorded as unavailable |

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

Phase Three adds `0003_foamy_vulture.sql`: four enums, versioned preflight
job/run/check, Business Fit and eligibility tables, indexes, foreign keys, and
bounded settings columns. It contains no drops or data rewrites. The migration
compatibility test preserves representative Phase One and Phase Two fixtures
through Phase Three. Do not apply it to production without explicit
authorization, verified backups, and a controlled release.

Phase Four adds `0004_glamorous_doctor_spectrum.sql` and
`0005_nifty_vindicator.sql`. They add separate audit job/run/page/finding,
score-version, Website Improvement Score, confidence, and review-history tables;
conservative disabled settings; indexes and foreign keys; RLS with no public
policies; and database-level safety bounds. They contain no drops, renames,
deletes, or rewrites. The migration test preserves representative Phase One,
Two, and Three records through both migrations. Do not apply these migrations
to production as part of development.

Phase Five adds `0006_rich_shadow_king.sql` and
`0007_pale_madelyne_pryor.sql`. They preserve existing outreach drafts while
adding their audit reference, structured brief fields, selected finding IDs,
review state, indexes, constraints, and RLS with no public policies. They do not
drop, rename, delete, or rewrite existing records. Apply them only through the
same controlled development and production review process.

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

## Preflight failure behavior and limitations

- One administrator only
- CSV uploads are bounded and processed synchronously; no original file blob is retained
- The database worker must be invoked by a trusted scheduler; no production
  schedule is enabled in this repository.
- Failed jobs retain safe error categories and use bounded retry/backoff. Prior
  successful runs and scores are never overwritten by later failures.
- Per-domain delay is bounded configuration for worker/scheduler coordination;
  each run claims only the configured concurrency-sized batch.
- Robots parsing is deliberately bounded to homepage policy.
- No licensed discovery provider or Google Places integration. Phase Four deep
  audits remain separate from preflight and never begin from eligibility alone.
- No automatic email outreach or email sequencing
- No analytics session replay or individual visitor profiles
- Portfolio cards and links are explicitly labeled placeholders
- Possible-duplicate thresholds are stored for future scoring refinement; the
  MVP uses deterministic exact and name/location rules
- Import correction is performed by fixing and re-uploading rejected rows

## Recommended next step

### Failure recovery and retention

- Retryable network failures use bounded exponential backoff and a fixed attempt
  limit. Permanent policy failures are blocked or failed with safe categories.
- A five-minute lease returns abandoned work to the bounded queue or exhausts it
  safely. PostgreSQL coordination prevents simultaneous claims above the
  configured concurrency.
- Later failures never delete earlier successful audits, scores, findings, or
  review decisions. Rejected findings remain in history.
- Audit retention defaults to `0`, meaning indefinite retention. Phase Four has
  no automatic deletion task. Any future retention process requires an explicit
  migration and operational review.

### Optional PageSpeed

PageSpeed is server-only and disabled by default. It runs only when both the
stored switch and `PAGESPEED_API_KEY` are present, uses the already validated
public homepage URL, requests mobile performance only, and stores provider,
score, availability, duration, and safe error classification. Missing,
rate-limited, malformed, or unavailable provider data adds no opportunity
points and does not fail the audit. No billing is enabled by this repository.

### Current limitations and Phase Six boundary

- Objective static HTML inspection cannot judge visual quality, persuasive
  writing, comprehensive mobile usability, search rankings, legal compliance,
  or complete accessibility.
- Client-rendered content is not executed and may therefore be unavailable.
- PageSpeed is optional; no local Lighthouse, browser, screenshot, Chromium,
  Puppeteer, or Playwright audit runs in production.
- Crawling, internal-link checks, evidence, pages, redirects, bytes, time,
  retries, concurrency, and daily work are strictly bounded.
- Phase Five creates no private/public report, public audit page, proposal,
  revenue-loss calculation, email delivery, sequence, payment, Google Places
  discovery, or automatic publication.
- Browser screenshots, revocable private reports, report expiration, and any
  licensed external discovery provider remain Phase Six decisions.
- Phase Five-ready state permits a private draft workflow only. It never sends,
  publishes, or contacts a business automatically.

### Development and production rollout checklist

1. Keep production migrations, secrets, switches, workers, and schedulers unchanged.
2. Apply Phase Five migrations only to a separate development database first.
3. Keep all preflight, deep-audit, and PageSpeed switches off unless a separate
   controlled worker test requires them.
4. Run `npm ci`, lint, type checking, tests, build, and `git diff --check`.
5. Manually verify the public brand, favicon, responsive sign-in and password
   reset, homepage portrait/copy, dashboard company search, inbound drafting,
   Phase Five-ready brief creation, approval, copying, contact history, audit
   reopening, and suppression invalidation.
6. Review the generated Phase Five SQL, outreach-draft RLS state, dependency audit, and pull
   request before authorizing any merge.
7. After a separately approved database backup decision, apply production SQL
   in a controlled step and verify existing lead, audit, and outreach-draft data.
8. Deploy with every worker switch off and verify public and private pages before
   approving any real outreach brief.
9. Do not configure a production scheduler or outbound email provider during Phase Five.

The next development step is local acceptance testing on the feature branch.
Request explicit authorization before pushing, opening a pull request, applying
production migrations, configuring secrets, deploying, or invoking production.
