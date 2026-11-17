# Terms and Privacy refresh — owner review

Review branch only; production release requires approval. This is website copy and a source-based storage disclosure, not a completed legal-compliance review or legal opinion.

Owner approved publishing these disclosures in a public review branch and preview on November 16, 2026; production remains a separate approval.

## Changes and implementation evidence

- Privacy covers public inquiries, private business records, limited first-party reporting, optional GA4, attribution, providers, retention, and requests.
- Storage inventory follows analytics-provider.tsx, analytics/google.ts, attribution.ts, Supabase server/browser clients, and the installed SSR SDK. It includes cookie, local-storage, and session-storage distinctions. No cookie values or tokens are published.
- GA4’s configured 90-day cookies are separate from property data retention. First-party cleanup defaults to 90 days and runs on accepted analytics requests; no scheduled deletion guarantee is made.
- Terms describe public-site use and separate written project agreements. Unknown governing law, liability caps, arbitration, refund policies, and project warranties were not invented.
- Both pages reuse the existing public header, navigation, mobile drawer, and footer; the extra standalone logo is removed.
- Public draft notices/placeholders removed. AnalyticsChoice, consent behavior, inquiry handling, authentication, database records, and tracking configuration are unchanged. No schema migration or new dependency.

## Owner review before publication

- Confirm Orbisy LLC’s public identity, Chicago business location, and info@orbisy.com contact. No street address or LLC formation jurisdiction is inferred.
- Confirm the provider list: Vercel, Supabase, Cloudflare Turnstile, Resend when enabled, and Google Analytics when allowed. Review vendor account settings and agreements for data locations and retention; the public page makes no residency guarantee.
- Confirm GA4 stream settings remain as documented: history-based page changes, scrolls, form interactions, and site search disabled. Other enabled enhanced measurements may transmit link metadata beyond the controlled event allowlist.
- Review the GA4 property retention setting; cookie expiry does not establish it.
- Establish an operational retention schedule for inquiries, client records, source histories, suppression records, backups, and provider logs. No universal deletion deadline is invented in this revision.
- Review permitted prospecting/import practices and privacy-request handling against actual operations and applicable law.
- Have appropriate legal advice address obligations for the locations and clients served. Paid project agreements and any data-processing terms need their own review; website Terms do not supply missing project contract clauses.

## Reference material

- https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business
- https://consumer.ftc.gov/business-guidance/privacy-security
- https://support.google.com/analytics/answer/11397207
- https://supabase.com/docs/guides/auth/server-side
- https://supabase.com/docs/guides/auth/sessions

## Verification

Record checks and preview review in the pull request. No production database changes are required.
