# Supporting tools: plain-language guide

## Purpose

Help the administrator decide which existing tools still support association website and software work. This change preserves records, settings values, worker behavior, administrator authentication, and existing URLs. It does not enable, disable, or remove any tool.

The `/admin-portal/tools` directory recommends prioritizing inquiries, client workspaces, private pricing, and website analytics. Imports, duplicate review, website checks (preflight), and audits remain optional prospect-research tools. Do-not-contact records remain useful for exclusions. These recommendations describe workflow fit, not measured usage or sales outcomes.

## In-product help

Every navigation destination has an introduction or a link into the guide. Eleven guide topics cover clients, leads, pricing, notifications, imports, duplicate review, preflight, audits, suppressions, analytics, and settings. Each explains purpose, fit for Orbisy, steps, output, limitations, when to skip it, and terminology. Import, preflight, and audit detail pages repeat the relevant guidance near decisions.

Phase 3 is explained as website checks, Phase 4 as website audits, and Phase 5 as manual outreach brief readiness. Existing identifiers and saved filter URLs are preserved. No stage sends outreach automatically. The old prospecting overview remains available in an expandable activity section rather than dominating the tool directory.

## Settings accuracy

All 51 controls remain in one form, including collapsed groups. Each has an accessible description. Six groups distinguish target/import basics, duplicate review, preflight permission/fit, preflight technical limits, audit permission/review, and audit technical/history settings. Enabled switches use affirmative labels.

Code inspection found limitations that are now explicitly described:

- Duplicate similarity thresholds are stored but are not used by the current fixed identifier/name/location matching rules.
- Import and audit retention values do not run an automatic deletion job.
- The preflight recheck interval is stored but not enforced or scheduled by the current queue.
- Preflight concurrency caps the requested batch size per worker invocation; it is not a global cross-worker lock.
- Configuration presence is not a connection test. Optional worker and PageSpeed configuration is distinguished from core functionality.

Saved target industries and locations are shown as prospecting rules. Nothing silently changes local-business defaults or saved records to association targets.

## Small functional corrections

Analytics submission cards now use the recorded `homepage_review_form_submit_success` and `project_request_form_submit_success` events. Counts are labeled tracked submissions and are explained as consent-dependent; saved Leads remain the authoritative inquiry records. Website-check pagination is exposed, and audit pagination retains its search term.

## Verification and release boundary

Run lint, TypeScript, all tests, and a production build. Tests exercise correct analytics event totals, authentication before metrics access, preservation of every settings value in collapsed form submissions, accessible help references, disabled example submissions, and the preview production boundary.

`/preview/tools` displays the real guide components and fictional, disabled settings without reading the database. It is available only in development or Vercel previews and returns 404 in production. Metadata prevents indexing. It is not an authentication bypass for the real tools.

No migration, new dependency, production settings write, or worker/network execution is required. Real signed-in browser CRUD remains constrained by the existing preview configuration. A production release is a separate step after review.
