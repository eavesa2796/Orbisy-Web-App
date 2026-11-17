# Consent-aware GA4 integration

Measurement ID: **G-DZQMLKQDTE**. This is public configuration, not an API secret. No Tag Manager container, new dependency, migration, environment variable, or production database write is required.

## Behavior

- Orbisy’s limited first-party reporting and saved lead workflow remain available.
- A separate Google Analytics choice is unset by default. Prior first-party permission is not treated as Google permission.
- The Google tag is inserted only after an explicit grant, on HTTPS orbisy.com or www.orbisy.com, and on an allowlist of known public pages.
- Global analytics opt-out, Do Not Track, Global Privacy Control, and unavailable choice storage prevent Google tracking. Admin, auth, API, preview, and unknown paths cannot send events.
- Declining Google Analytics leaves the existing limited reporting choice unchanged. Opting out of all analytics also withdraws Google permission and attempts to clear this property’s accessible `_ga` cookies.
- Returning to first-party reporting does not automatically grant Google permission again.
- Google’s disable flag stops collection on withdrawal or private navigation. Queued commands are cleared so denied activity is not replayed.
- Page views are manual, deduplicated per public navigation, and sent after consent. Query strings, fragments, dynamic document titles, and full referrer URLs are excluded from controlled payloads. Referrer origins are retained; campaign/query labels are not forwarded to Google.
- Advertising personalization and Google signals are disabled; advertising consent remains denied. Cookies are configured for 90 days without renewal on each event.
- The privacy page and footer provide persistent access to analytics choices. The banner is a non-modal, keyboard-accessible choice with equal access to allow/decline actions.
- Previews and localhost do not send Google requests, even if the choice UI is exercised, avoiding pollution of the production property.

## Event mapping

| Website event | Google event | Meaning |
| --- | --- | --- |
| `page_view` | `page_view` | One allowed public page navigation |
| `project_request_form_submit_success` | `generate_lead`, `form_type=project_request` | Inquiry saved successfully; duplicate retries are excluded by the existing form flow |
| `homepage_review_form_submit_success` | `generate_lead`, `form_type=website_review` | Review inquiry saved successfully |
| Existing CTA, form-start/view/validation, FAQ and scroll events | Existing event name | Public-site interaction; does not contain form fields |

Only allowlisted component identifiers are forwarded. Names, email addresses, organization names, project descriptions, database identifiers, and Orbisy session IDs are not forwarded in controlled events. Google Analytics still processes technical information and analytics cookies according to its own service behavior. This implementation does not identify visitors as association decision-makers or connect Google user identifiers to private lead records.

## Required GA4 account checks before production launch

The implementation cannot verify the Google account’s settings from the supplied Measurement ID alone.

1. Open GA4 Admin → Data streams → Orbisy web stream. Confirm **G-DZQMLKQDTE** and the intended site URL.
2. In Enhanced measurement settings, turn off **Page changes based on browser history events**, **Scrolls**, **Form interactions**, and **Site search**. The owner confirmed these settings were saved before release. The code sets `send_page_view: false` and supplies its own page views, scroll events, and saved-only lead events. Outbound clicks, file downloads, and supported video measurements are optional: enable them only when useful after reviewing their collected URLs and metadata. Such automatic events are governed by Google stream settings, not the controlled-event payload allowlist in this code.
3. Confirm property data-retention and data-sharing choices. Keep advertising/Google-signals features off unless a separate reviewed requirement is introduced.
4. In Admin → Data display → Events, mark `generate_lead` as a key event when available (or create the named key event). Do not use generic form submission as the lead outcome.
5. After an approved production release, allow Google Analytics in a fresh public browser session and check Realtime/DebugView while navigating known public pages. Validate one page view per navigation and the real inquiry flow; mark any deliberately created test lead clearly. A test inquiry sends the existing notification and should be coordinated, not silently created on production.
6. Decline/withdraw permission, check that subsequent Google collection stops, and verify that the inquiry form remains functional. Preview browser tests cannot establish receipt in the Google property because previews are deliberately blocked from sending Google traffic.

## Verification

Regression coverage exercises absence of the tag before consent, decline, grant, pageview deduplication and referrers, private/unknown paths, DNT/GPC/global opt-out, storage failure, sanitized events, script failure, preview blocking, withdrawal/regrant, and accessible preference controls. Existing inquiry tests verify saved-only success tracking and duplicate retry behavior.

Run lint, TypeScript, all tests, and the production build. Browser-review the consent banner and privacy controls on the review deployment. Confirm the CSP permits only the required Google script/collection origins while retaining existing restrictions.

Production launch remains a separate approved step after the GA4 account checks above.

## References

- https://developers.google.com/tag-platform/security/concepts/consent-mode
- https://developers.google.com/tag-platform/security/guides/privacy
- https://developers.google.com/analytics/devguides/collection/ga4/reference/config
- https://support.google.com/analytics/answer/9216061
- https://support.google.com/analytics/answer/13128484
