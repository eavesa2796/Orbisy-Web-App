# Agency refresh verification

The complete consultation flow is: public page → validated submission API → atomic submission/lead/notification transaction → saved confirmation → optional success analytics → provider notification → authenticated review/retry. Pricing is: authenticated page → validated administrator action → pricing table and activity log → fresh catalog read.

## Passed

- ESLint and TypeScript.
- 126 tests across 27 files, including the original import, preflight, audit, suppression, pipeline/outreach, analytics, and migration regressions.
- Next.js production build. This constrained local environment requires an external temporary adapter for an unavailable RSS query; it is not included in the repository. The first implementation commit also built/deployed successfully on Vercel without that adapter.
- An isolated in-memory PGlite database received migrations 0000–0008. Representative prior lead data survived 0008; no connected database was touched.
- Actual API and Drizzle persistence tests: server validation, consent, honeypot, spam failure, rate-limit rejection, atomic lead save, rollback on lead failure, idempotent resubmission, attribution suppression, missing email configuration, failed provider response, cooldown, retry to accepted state, and stable provider idempotency key.
- Pricing actions: repeatable 15-template insertion with null amounts; create/edit base, setup and recurring amounts; deliverables; active/archived transitions; validation failure; authorized fresh reads. Unauthorized reads/actions/retries are rejected before database access. Anonymous direct database reads return no private records under RLS.
- Client tests: a request retains its token across errors, saved success is measured only after confirmation, duplicates do not report another conversion, opt-out/DNT/GPC prevent inquiry attribution, and optional analytics errors do not affect confirmation.
- Hosted browser at 1363 × 936: homepage positioning, logo, project imagery, service navigation, contact anchor, substantive service pages, service-prefilled forms, towing page, campaign pages with noindex, and private pricing redirect to sign-in. Inspected pages have a document width of 1348 within a 1363 viewport; no horizontal overflow observed. Both real project screenshot assets loaded.

- Production HTTP checks: all public/service/campaign routes and project screenshot files returned 200; retired and unknown routes returned 404; campaign pages emitted noindex; sitemap excluded private/archive/campaign routes. Anonymous Pricing and Notifications responses contained a streamed redirect and no catalog content. Invalid inquiry returned 400 with field errors; a valid inquiry returned 503 when DATABASE_URL was absent.

Desktop evidence: [homepage screenshot](screenshots/agency-desktop.jpg).

## Configuration blockers and verification limits

- Hosted Preview inquiry: a labeled QA submission with website, budget, and timing left blank returns “The request form is not configured yet. Please email info@orbisy.com.” DATABASE_URL is absent in Preview. No test lead or email was created by this check.
- Hosted administrator access: `/admin-portal/pricing` redirects to `/admin-portal`, which displays “Authentication is not configured. Add the documented Supabase environment variables to enable administrator sign-in.” Signed-in catalog editing cannot be verified on this deployment yet.
- No DATABASE_URL is available locally. `npm run db:target` reports “DATABASE_URL is missing. No database target was contacted.” Identify the intended Preview database before applying 0008. Steps and required environment scopes are in `agency-refresh-operations.md`.
- Resend live delivery remains unverified. Configure RESEND_API_KEY, RESEND_FROM_EMAIL, and NOTIFICATION_EMAIL, then verify provider acceptance and inbox delivery. Database/provider-failure behavior has been tested with a mocked email transport.
- Turnstile’s real Preview widget and hostname validation require the matching Preview keys; production validation remains enforced by the existing server verification function.
- CSS includes mobile layouts for navigation, hero, portfolio, engagements, forms, and Pricing. The available browser cannot resize or expose responsive inspection, so actual phone rendering is unverified. Review on a phone before launch.
- Campaign-specific landing pages are prepared; no Google Ads account IDs or conversion tags were supplied or activated.

Production launch is a separate step. No production environment values, account credentials, database records, or deployment aliases were changed.
