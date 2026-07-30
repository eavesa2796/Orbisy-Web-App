# Orbisy — Phase One

Orbisy is Anthony Eaves’s Chicago-based software-development business. This
Phase One MVP combines a public service website, secure inbound forms, a
single-administrator lead workspace, manual outreach preparation, and
privacy-conscious first-party analytics.

No automated outreach, CSV importing, website auditing, lead scoring, public
reports, or bulk email exists in this phase.

## Architecture

- Next.js 16 App Router, React 19, TypeScript, and plain CSS
- PostgreSQL with Drizzle ORM and versioned SQL migrations
- Supabase Auth for one allowlisted administrator
- Route Handlers for public submissions and anonymous analytics
- Database-backed rate limits suitable for a single-region MVP
- Optional Cloudflare Turnstile and optional Resend inbound notifications

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

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
# or all at once
npm run verify
```

Tests currently cover submission validation and the strict analytics event
allowlist. Before launch, manually test the signed-out and signed-in admin
flows against the configured Supabase project and verify form persistence in
the production-like database.

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

## Phase One limitations

- One administrator only
- No file uploads or screenshot storage
- No background job worker
- No data-provider integrations, imports, audits, scores, or reports
- No automatic email outreach or email sequencing
- No analytics session replay or individual visitor profiles
- Portfolio cards and links are explicitly labeled placeholders

## Recommended next step

Configure a development PostgreSQL database and Supabase project, run the
migration, create the allowlisted administrator, and complete a local
end-to-end acceptance test before creating any production deployment.
