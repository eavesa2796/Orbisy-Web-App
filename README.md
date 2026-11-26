# Orbisy — Association Websites & Business Operations

[Website](https://www.orbisy.com) · [Portfolio](https://www.orbisy.com/work) · [Project planning](https://www.orbisy.com/project-planning)

Orbisy is a production full-stack application for Orbisy LLC's development business.
The public website presents custom association websites, member portals, scoped
integrations, and ongoing development services. A private administrator workspace
manages inquiries, leads, client projects, pricing, knowledge articles, and email
workflows.

The public site and internal tools share one Next.js codebase, backed by
PostgreSQL and Supabase Auth. The application currently supports one allowlisted
administrator. The association member-area example is an illustrative concept;
the working administrator portal supports Orbisy's own operations.

## What the application includes

- **Public website:** association-focused services, project pricing and planning,
  real website portfolio work, a labeled association website concept, and inquiry
  forms. Earlier records-service pages and assets remain archived.
- **Lead and client management:** saved inquiries, received timestamps, source
  attribution, pipeline history, notes, follow-up dates, client workspaces,
  discovery briefs, milestones, and sales reporting.
- **Private pricing catalog:** editable services, packages, deliverables, billing
  details, internal notes, and draft/active/archived states. Public pricing is
  separately defined in source configuration.
- **Knowledge publishing:** draft, publish, unpublish, and archive controls;
  version checks; and a public published snapshot that excludes internal notes.
- **Inquiry follow-up:** reviewed acknowledgments and reminder workflows,
  Gmail metadata-based reply detection, Resend delivery reconciliation,
  preference handling, and optional owner digests.
- **Reviewed outreach:** separate Gmail sending authorization, per-prospect
  message review, campaign controls, weekday sending limits, reply/opt-out stops,
  and persisted attempt/error history.
- **Supporting tools:** bounded CSV imports, normalization, duplicate review,
  suppression records, and administrator-reviewed website preflight/audit tools.

These are commissioned services and business tools. The association concept is
not a completed client member portal, and the repository does not implement
MemberClicks, Whova, Cadmium, or eShow connectors. A RAG chatbot is future work;
the knowledge base already provides an explicit public-passage projection for
a possible retriever.

## Technology stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 App Router, React 19 |
| Language | TypeScript with strict compiler checking |
| UI | Semantic HTML, CSS/CSS Modules, Lucide icons, Embla Carousel |
| Images and typography | Next.js image/font facilities; DM Sans and Manrope |
| Server | Node.js, Next.js Route Handlers and Server Actions |
| Validation | Zod |
| Persistence | PostgreSQL, Drizzle ORM, Postgres.js |
| Schema management | Drizzle Kit and versioned SQL migrations |
| Authentication | Supabase Auth with browser/server SSR clients |
| Supporting tools | Cheerio, csv-parse, tldts, ipaddr.js |
| Testing | Vitest, React Testing Library, jest-dom, jsdom, PGlite |
| Quality and delivery | ESLint, TypeScript, GitHub pull requests, Vercel previews/production builds |

Exact dependency versions are recorded in [package.json](package.json) and
[package-lock.json](package-lock.json).

## Architecture and reliability

React Server Components provide server-rendered data and pages; Client
Components handle interactions such as forms, navigation, carousels, and consent.
Protected dashboard mutations use Server Actions, while public intake, provider
callbacks, exports, and worker triggers use Route Handlers.

Application data is read and written on the server through Drizzle/Postgres.js.
Supabase Auth validates the signed-in user, and server-side authorization checks
the configured administrator email. Database constraints, transactions, private
table access controls, and migration checks complement those application checks.

### Inquiry flow

1. A public form submits to `POST /api/submissions/[type]`.
2. The server validates the payload, checks rate limits, and verifies Turnstile.
3. One transaction saves the inquiry, associated lead, and pending notification.
   A submission token prevents duplicate records.
4. The server returns a saved confirmation. Consented lead measurement follows a
   confirmed nonduplicate save.
5. Notification delivery is attempted after the response. A provider failure
   leaves the inquiry saved and the notification available for review/retry.

### Background email work

Email state and event history persist in PostgreSQL. Atomic claims, expiring
leases, suppression checks, and immutable first-attempt payloads coordinate work
across requests. The deployed email scheduler uses Supabase Cron to invoke the
protected worker every five minutes, with its bearer credential held in Vault.
Scheduler installation is an operational step, not an automatic migration or
application-build side effect.

Inquiry and outreach workflows have separate mailbox records, settings, and
approvals. Resend work uses stable idempotency keys and bounded retries. Gmail
outreach pauses ambiguous attempts for review because its send API does not
provide an application idempotency key. Provider acceptance is recorded
separately from evidence of delivery; inbox placement is not guaranteed.

New installations start with email sending disabled. A deployment flag alone
does not approve a campaign, enroll contacts, or enable customer sending. Live
mailbox health and activation state must be checked in the private workspace.

## Integrations and HTTP interfaces

| Integration | Purpose |
| --- | --- |
| Supabase Auth / PostgreSQL | Administrator authentication and durable application data |
| Google OAuth / Gmail API | Business mailbox authorization, selected message metadata, and reviewed outreach sending |
| Resend API and signed webhooks | Inquiry notifications, acknowledgments, reminders, digests, and delivery-event reconciliation |
| Cloudflare Turnstile | Public form spam verification |
| Google Analytics 4 | Consent-controlled public audience and interaction measurement via `gtag.js` |
| Google PageSpeed Insights | Optional, separately configured performance input for supporting audit tools |
| Selected public websites | Bounded HTTP inspection with DNS/IP, redirect, robots, timeout, and size controls |

Google Analytics does not require a Tag Manager container in this implementation.
Internal sales reporting uses saved business records rather than an embedded
GA reporting API. The retired `/api/analytics` collector returns 204 and preserves
historical records without collecting new visitor events.

| Route or interface | Role |
| --- | --- |
| `/api/submissions/[type]` | Public `project-request` and `homepage-review` intake |
| Server Actions under `/admin-portal` | Authenticated lead, client, pricing, publishing, and workflow operations |
| `/api/admin/imports` and companion routes | Protected CSV staging, template, and rejected-row export |
| `/api/admin/discovery/[id]` | Protected Markdown discovery-brief export |
| `/api/admin/followups/gmail/start`, `/api/admin/outreach/gmail/start` | Separate Gmail authorization entry points |
| `/api/admin/followups/gmail/callback` | Shared Google callback with validated flow-specific state |
| `/api/internal/followups` | Secret-protected inquiry and outreach worker trigger |
| `/api/followups/delivery` | Signed Resend delivery webhook |
| `/api/followups/unsubscribe`, `/api/outreach/unsubscribe` | Signed preference endpoints |
| `/email-preferences`, `/outreach-preferences` | Standalone preference confirmation pages |
| `/api/internal/preflight-worker`, `/api/internal/deep-audit-worker` | Protected supporting-tool workers; preflight trigger also runs one queued association website scan when enabled |

## Local development

Requirements: Node.js 24.x, npm, a PostgreSQL development database, and Supabase
Auth configuration to use the private workspace. Read [AGENTS.md](AGENTS.md)
before changing the application.

```bash
npm ci
cp .env.example .env.local
```

Configure `.env.local` using development values. Set `DATABASE_URL` to the
intended development database before running migrations; do not copy production
secrets into a development checkout.

```bash
npm run db:target
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`. The private sign-in page is `/admin-portal`.
Create the intended administrator in Supabase Auth, set `ADMIN_EMAIL` to that
account, and configure the appropriate site/auth-recovery redirect URLs for the
environment. A valid session for a different account does not grant admin access.

### Configuration groups

| Group | Environment variables |
| --- | --- |
| Database and admin authentication | `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_EMAIL` |
| Site origin and form protection | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `RATE_LIMIT_SECRET` |
| Inquiry attribution | `INQUIRY_ATTRIBUTION_ENABLED`; legacy `ANALYTICS_ENABLED=false` also disables source capture |
| Resend notifications and inquiry email | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NOTIFICATION_EMAIL` |
| Gmail authorization | `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `FOLLOWUP_TOKEN_ENCRYPTION_KEY` |
| Email workers and preferences | `FOLLOWUP_CRON_SECRET`, `FOLLOWUP_RESEND_WEBHOOK_SECRET`, `FOLLOWUP_UNSUBSCRIBE_SECRET`, `FOLLOWUP_POSTAL_ADDRESS` |
| Independent deployment gates | `FOLLOWUP_SEND_ENABLED`, `OUTREACH_SEND_ENABLED` — unset/false during setup |
| Supporting tools | `PREFLIGHT_WORKER_SECRET`, `DEEP_AUDIT_WORKER_SECRET`, optional `ORBISY_FETCHER_USER_AGENT` and `PAGESPEED_API_KEY` |
| Association prospect scans | `ASSOCIATION_PROSPECTING_ENABLED=false` by default; server-only `BRAVE_SEARCH_API_KEY` |

[.env.example](.env.example) contains the base template. The email guides below
document feature-specific keys, secret formats, provider setup, and activation.
`OUTREACH_SEND_ENABLED` is an additional gate documented in the outreach guide;
leave it unset or false in a development/preview environment.

The Gmail flows currently target Orbisy's canonical production origin and
business mailbox. They are not generic multi-account connectors. Production
OAuth and email/preference mutation routes enforce deployment restrictions.
Read-only `/preview/*` pages use fictional data in development/preview and are
unavailable in production.

Only intentionally public configuration uses the `NEXT_PUBLIC_` prefix. Keep
database credentials, OAuth secrets, refresh tokens, signing keys, mailing
configuration, and scheduler credentials out of Git and client bundles.

## Database changes and verification

The schema is in [src/lib/db/schema.ts](src/lib/db/schema.ts); versioned SQL and
Drizzle metadata are in [drizzle/](drizzle/). Generate migrations after schema
changes, review the SQL, and apply it against a verified database target.

```bash
npm run db:generate
npm run db:target
npm run db:migrate
```

Existing production databases require a controlled migration step with schema
and history inspection, backups/recovery planning, and existing-record checks.
An already-applied migration must not be replayed or recorded with an invented
hash. The [agency release operations guide](docs/agency-refresh-operations.md)
documents the verified baseline procedure for earlier migration history.

```bash
npm run lint
npm run typecheck
npm test
npm run build
# Run the checks in sequence:
npm run verify
# Bound test concurrency when the local environment has limited resources:
npm test -- --maxWorkers=2
```

Tests include components, validation, authentication boundaries, migrations,
publishing, database-backed workflows, timing, suppression, and provider failure
behavior. PGlite supplies the test database; external providers are mocked in
automated tests. Real delivery, OAuth, and opt-out behavior need separately
controlled end-to-end verification.

Vercel creates preview/production builds from the GitHub workflow. The complete
lint/type/test/build command is explicit; the repository does not currently
include a GitHub Actions workflow running that full suite on every PR.

## Security and operating boundaries

- Private pages, Server Actions, and protected APIs enforce administrator access
  on the server. Hidden navigation and `noindex` are additional privacy measures.
- Public forms use authoritative validation, a honeypot, bounded requests,
  Turnstile, idempotency, and database-backed rate limits.
- OAuth state and webhook signatures are verified. Refresh tokens are encrypted;
  incoming Gmail bodies/attachments are not copied into Orbisy.
- Preference GET requests are read-only. Confirmation POSTs save suppression and
  stop pending messages. Existing do-not-contact records remain authoritative.
- GA4 is restricted to consented public activity and honors browser privacy
  signals. Private routes and inquiry contents are excluded from its events.
- Website inspection blocks prohibited network destinations and revalidates
  redirects. It does not run a remote site's JavaScript or submit its forms.
- Preflight, deep-audit, and PageSpeed switches are separate from email controls.
  Worker code alone does not establish an active production schedule.
- These controls do not establish security/accessibility certification,
  association-vendor partnerships, proven marketing results, or enterprise scale.

## Source and documentation map

| Location | Contents |
| --- | --- |
| `src/app` | Public/admin pages, API handlers, and Server Actions |
| `src/components` | Public and private interface components/styles |
| `src/lib/data` | Server-side data access for pages and dashboards |
| `src/lib/db`, `drizzle` | Typed PostgreSQL schema, connection, and migrations |
| `src/lib/followups`, `src/lib/outreach` | Separate inquiry and reviewed-outreach workflows |
| `src/lib/imports`, `src/lib/preflight`, `src/lib/audits` | Supporting data and website-inspection tools |
| `archive/records-service-2026-10-02` | Preserved earlier records-service pages and assets |

Feature guides and release notes:

- [Client workspaces](docs/client-workspace-release.md) and [admin workflow](docs/admin-workflow-cleanup.md)
- [Knowledge publishing](docs/knowledge-base-release.md)
- [Pricing and inquiry timestamps](docs/admin-pricing-and-inquiry-times.md)
- [Inbound email follow-up](docs/inbound-followups.md)
- [Reviewed Gmail outreach](docs/outbound-outreach.md)
- [Google Analytics](docs/google-analytics-release.md), [measurement](docs/campaign-measurement.md), and [sales reporting](docs/sales-reporting-release.md)
- [Supporting tools](docs/supporting-tools-guide.md)
- [Earlier README and phase notes](docs/archive/readme-before-association-overview.md)

Release notes describe their original implementation/release boundaries.
Historical activation statements are not a live status report; use the current
administrator workspace and verified deployment/database state for operations.
