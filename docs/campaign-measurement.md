# Orbisy campaign measurement

## Scope

- GA4 remains the audience-reporting system, using the existing consent-gated `G-DZQMLKQDTE` tag. No additional tag manager, Ads tag, Meta pixel, or proprietary event collector is installed.
- Controlled GA4 URLs remain known public paths with no query strings/fragments. Validated marketing labels are passed as documented `campaign_source`, `campaign_medium`, `campaign_name`, `campaign_content`, and `campaign_term` configuration fields when the tag initializes after consent. Names/contact details, click identifiers, form contents, and database IDs are not passed by these controlled events.
- Campaign fields describe the consented tag's current landing URL. Earlier events are not replayed on consent, and earlier UTM tags are not reconstructed from optional inquiry-attribution storage. Ad click IDs remain excluded. This supports manually tagged acquisition, not a claim of complete Google Ads attribution.
- Page events include `content_group` and a fixed `service_interest`; non-service pages explicitly clear stale service interest. GA4 supplies its standard user/session, device/browser, engagement, and approximate-geography reports according to consent and account settings.
- Known uninstrumented public links now produce fixed consultation, email, service, portfolio, association-overview, and pricing labels. `TrackLink` carries a marker so its existing handler is not counted a second time by delegation. No arbitrary link text or destination is sent by this controlled layer.
- Existing form-render and first-focus events remain. New submit-attempt and submit-error events distinguish attempts/network/server/rate/spam failures from 400/422 responses containing field-validation errors. A submit error is not a conversion. `generate_lead` remains conditional on a confirmed new save, excluding duplicate retries.
- The private saved inquiry/lead system remains independent of Google consent. Its source attribution and current outcomes are preserved; no visitor-to-lead Google identifier join has been added. The privacy acknowledgment version is updated for new submissions only; historical records remain unchanged.

## Admin tools

`/admin-portal/measurement` requires administrator authorization and explains the reporting map, limitations, Google Ads handoff, and custom dimensions. Its campaign URL builder operates locally and permits only known Orbisy service landing pages with safe campaign labels. It neither persists data nor connects advertising accounts.

`/preview/measurement` renders the same guide and builder without account/database data on preview/development deployments only; it returns 404 in production.

## Google account setup still required

1. Confirm the intended GA4 property and test `generate_lead` receipt after consent. Register event-scoped dimensions for `service_interest`, `component_id`, and `form_type` as useful. `content_group` is a built-in dimension. Account setup has not been verified by the code changes.
2. Link the intended Ads account and GA4 property with the correct permissions, review auto-tagging, and create/import the intended lead conversion. Review primary/secondary status and lead-count settings; avoid duplicate conversions from a second tag. Do not optimize bidding toward page views or scrolls.
3. Review GA4 enhanced measurement and email/query redaction. Keep history-change pageviews and automatic form interactions disabled to avoid overlapping controlled events. Enhanced outbound/download/video events follow their own stream settings.
4. Resolve the site's intentionally denied advertising consent and absence of click-ID capture before relying on Ads attribution. Linking accounts does not itself implement Ads consent, enhanced conversions, offline conversions, or cost imports. A future Ads/Meta tag requires its own reviewed configuration and privacy/consent treatment.
5. Test actual campaign attribution and conversion recording in Google diagnostics before spending. Website unit/build tests cannot verify an account's reporting or bidding configuration.

No new database migration or required environment variable is introduced. Deploy only after review; production remains on its prior release until explicitly approved.

Primary references:
- https://developers.google.com/analytics/devguides/collection/ga4/reference/config
- https://support.google.com/analytics/answer/9379420
- https://support.google.com/analytics/answer/10632359
- https://support.google.com/google-ads/answer/3438531
- https://support.google.com/google-ads/answer/11461796
- https://support.google.com/analytics/answer/13544947
