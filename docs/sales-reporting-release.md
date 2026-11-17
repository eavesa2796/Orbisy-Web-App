# GA4 audience reporting and Orbisy sales overview

## Behavior

GA4 is the sole collector of new public website interaction events. Google consent, global opt-out, DNT/GPC, public-path checks, payload limits, production-host gating, and saved-only generate_lead behavior remain in place. Manual page views remain deduplicated; automatic browser-history page views and automatic form interactions should stay off in the Google stream to avoid overlapping counts. Site-search collection remains off unless separately reviewed. No GA4 account settings were changed by this code update.

The browser no longer creates a proprietary reporting session identifier, sends a beacon/fetch to /api/analytics, or stores events in analytics_events. The old endpoint unconditionally acknowledges requests with 204 and performs no database access, including requests from old open tabs. It cannot be re-enabled through ANALYTICS_ENABLED. Historical rows are not deleted or modified. The former request-driven retention cleanup is retired too.

The admin Sales overview uses saved inquiries as its cohort, with current linked-lead statuses, service requests, and available source/medium/campaign details. Imported/manual leads are excluded from inquiry totals. Due follow-ups are a separate all-date view of open leads; won, lost, and suppressed leads are excluded. Workspace proposal counts are separate from inquiry proposal counts to avoid combining overlapping records. No website conversion rate or inferred revenue is presented.

Source uses a captured campaign source, then a referring domain; absent information is labeled Not captured. Declined/blocked attribution and missing information are not labeled Direct. Source capture is still independent of Google permission and respects the existing global opt-out, DNT, and GPC. Inquiry saves work without either kind of measurement.

Existing /admin-portal/analytics bookmarks redirect to /admin-portal/sales. Retained traffic reports remain read-only at /admin-portal/analytics/history. Admin authorization remains required; public pages cannot read these records.

## Configuration and data

No migration, new provider, paid service, new secret, or mandatory environment update. INQUIRY_ATTRIBUTION_ENABLED=false optionally disables attribution server-side. Existing ANALYTICS_ENABLED=false is still honored for that purpose. ANALYTICS_RETENTION_DAYS no longer drives event deletion. Existing consent choices are preserved and never promoted to Google grants.

Current Privacy Policy, storage disclosures, and README describe GA4, inquiry attribution, retained historical reports, and the retired identifier. Prior release documents remain historical records of earlier implementations. No new deletion deadline or retention guarantee is invented.

## Review preview

/preview/sales shows fictional examples using the real proposed SalesOverview component and reads no database records. Its date controls change the example period label, not the fixed fictional totals. It returns 404 in production. Real sales data remains behind the existing administrator sign-in.

## Validation and release checks

- Test the real form-to-Google bridge: no generate_lead for a failed save, one after a confirmed nonduplicate save, no private form values in Google payloads, and no proprietary beacon or event endpoint requests. Save still succeeds when Google permission is declined.
- Existing duplicate/unconfirmed-save tests, Google consent/privacy tests, and inquiry persistence tests remain required.
- PostgreSQL-backed tests verify cohort counts, current status interpretation, unknown sources, imported-lead exclusion, separate follow-up/workspace counts, retained historical events, unchanged business records, and admin authorization.
- Before production, verify generate_lead receipt in the actual GA4 property using a deliberate consented test inquiry, or have the owner verify a real saved inquiry. Automated checks prove emission behavior, not delivery to Google’s reporting UI. Realtime page activity was confirmed by the owner; saved-inquiry event receipt remains a separate release verification.
- Review preview and production deployment separately. After approved deployment, confirm the collector returns 204, saved-inquiry flow remains available, and Sales overview/history can be opened by the administrator. An unavailable database must show an error state rather than misleading zero totals.

No production records or GA4 settings are changed during preview preparation.
