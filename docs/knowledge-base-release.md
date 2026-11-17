# Knowledge base — implementation and release guide

## Review scope

Public /knowledge-base library, text search, four topics, linked article pages, related articles, content review dates, and consultation paths. Existing public navigation/footer and administrator navigation include the library. No chatbot, LLM provider, embedding jobs, vector extension, or new chat tracking is enabled.

The authenticated article manager is /admin-portal/knowledge-base. Every read and write requires the existing administrator allowlist. Authentication identities are unchanged.

## Preview data versus real content

On Vercel preview deployments, the PUBLIC library uses six clearly labeled proposed starter articles instead of accessing database records. The proposed content makes no association case-study, certification, completed integration, rate, or service-level claims. Its dates are illustrative preview values, not a claim that the owner reviewed the content.

/preview/knowledge-base is a read-only editor design review with no database access. Its save/publish controls are disabled, and the route returns 404 in production. This page does not stand in for authenticated persistence testing.

Production uses published database snapshots only, with no automatic seeded articles. The list shows an honest unavailable state when the database cannot be queried. Unpublished, archived, invalid, or nonexistent article addresses do not expose drafts.

## Deployment requirement

This feature needs its reviewed knowledge-base migration before the authenticated article manager can persist content. No existing records are removed. Deployment and initial publication remain separate from this review preview.

## Daily publishing instructions

- New article: choose a descriptive unique lowercase slug, topic, title, summary, and body.
- Content format: paragraphs separated by blank lines, ## headings, and consecutive - bullet lines. HTML/scripts are displayed as text, never executed. No rich HTML or file upload is accepted.
- Save draft changes: store working text; do not change an existing public snapshot.
- Publish this version: validate the summary/content and actual review date, then replace the public snapshot. The date cannot be in the future. Each publication increments a revision.
- The slug is locked after first publication, including while unpublished or archived, to protect previously shared links.
- Unpublish: make the record private. Archive: hide it and retain the record. Neither deletes content. Publish can restore it.
- Internal editorial notes and editor identities remain private. Public content must never contain client records, credentials, confidential member data, or unapproved promises.
- Stale edits are rejected; copy unsaved text before reloading. The current version number protects against overwriting another saved edit.
- A starter import adds missing slugs as drafts; it never overwrites existing matching articles or auto-publishes them.

## Future RAG boundary

getPublicKnowledge selects only published snapshots. knowledgePassages creates citation paths, section identifiers, and revisioned passage identifiers from that explicit projection. Internal notes, working copies, leads, pricing, client workspaces, and other private records are outside it. There is no public bulk export endpoint.

Before adding AI: choose the provider, retrieval/index update strategy, costs and rate limits, prompt-injection defenses, deletion/unpublish handling, citation checks, abstention behavior, and chat retention. Update privacy disclosures for the chosen data flow before recording conversations or sending them to a provider. The future index must remove unpublished/archived sources and invalidate older revisions.

## Search and reporting

Search is server-rendered GET with a labeled search field, bounded query, and topic filters; it works without JavaScript. No new search event or raw query payload is sent to Google. Only /knowledge-base is added to the controlled Google page allowlist; arbitrary editor-created article slugs remain outside that allowlist. Existing consent/privacy behavior is unchanged.

Sitemap includes only published article URLs in production and excludes preview examples. Article metadata uses the published title/summary; drafts/internal notes are never selected for metadata.

## Validation

Database-backed automated tests exercise real PostgreSQL semantics using PGlite, apply all migrations, enforce publication boundaries, test stale versions and unique slugs, verify admin checks and API-role privilege removal, and preserve an existing lead. Render tests cover safe content, section anchors, search labels, and empty states. Final check results and browser review are recorded in the PR.
