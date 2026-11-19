# Orbisy inbound email follow-up

## What is implemented

- A private Follow-up inbox for saved website inquiries only. It includes message review/approval, pause/reopen/close controls, a conversation timeline, worker/system activity, and a daily digest option for `info@orbisy.com`.
- Response hours are 05:00–21:00 America/Chicago every day. Reminder emails stay inside that window. Receipt acknowledgments can be sent outside it and explain the next-morning expectation near closing/overnight. Follow-up scheduling preserves Chicago wall-clock time across daylight saving changes.
- Enrollment is off by default and starts at activation time. Historical/imported leads are not bulk-enrolled. Explicit enrollment creates a draft. One open conversation per email prevents overlapping sequences. Fresh inquiries under 15 minutes old may use the explicitly reviewed automatic acknowledgment setting; older ones remain drafts.
- After the owner confirms a personal Gmail response, two drafts are prepared for two and seven business days later. All seven days are business days. Every reminder needs individual approval. The second reminder also waits at least five business days after the first provider acceptance. Each inquiry gets one bounded sequence; it does not restart automatically.
- Personal response confirmation writes the existing contacted stage/contact history. A detected or manually recorded inbound reply pauses the sequence and marks an early-stage lead replied without overwriting later proposal/client outcomes. Consultation/proposal/won/lost/suppressed lead changes stop pending messages.
- Gmail OAuth requests `gmail.metadata` only. It verifies the connected account is `info@orbisy.com`, stores the refresh token under AES-256-GCM encryption, and reads selected From/To/Cc/Bcc headers, labels, IDs and timestamps—not bodies/attachments. Connecting/reconnecting pauses existing conversations and disables enrollment/sending for review.
- The mailbox synchronizer follows paged history with durable cursors and idempotent matched events. Sending stays blocked during backlog, sync errors, or stale sync. It compares against original inquiry receipt time so replies before enrollment are not lost. Unrelated mailbox metadata is not copied into the database.
- The sender persists an immutable payload and first-attempt marker before calling Resend. Stable keys, bounded backoff, leases, and a 23-hour retry boundary protect against duplicate sends. Uncertain old sends require manual provider-log review, not blind retries. Provider acceptance is distinguished from inbox delivery.
- Signed Resend delivery events are verified against the raw, bounded request body and a five-minute timestamp tolerance. Replays are idempotent. Early events can reconcile after the sender stores its provider ID. Bounces/complaints pause and suppress; failures pause for review.
- Reminder emails require a configured business mailing address and signed stop-follow-ups link. The human confirmation page is read-only on GET; POST stops the sequence and records email suppression. One-click unsubscribe POST is supported. Suppression is checked again before sending.
- Daily digests are opt-in, default to 18:00 Chicago time, are deduplicated by local date, and skip stale queued digests. SMS and calendar integrations are not implemented.

## Initial state and release boundary

No customer sending, Gmail authorization, scheduler, Resend webhook, or SMS service is enabled by this change. All sending/enrollment settings default off. Both the production environment gate and the administrator's sending switch must be enabled before approved mail can send. Preview deployments cannot run the worker or initiate Gmail OAuth, and delivery/preference mutation endpoints are production-only. Saved inquiry/owner notification code remains separate; a follow-up failure does not roll back a saved inquiry.

`/preview/followups` is a read-only review UI with fictional data and disabled mutation controls. It reads no database or mailbox and returns 404 in production.

## Deployment and configuration

1. Verify the intended existing database and both migration histories. Apply reviewed `0012_inbound_followups.sql` through the established Drizzle release procedure, retaining its matching journal/hash convention. It adds four private tables with RLS and revoked public/anon/authenticated grants. It does not seed contacts, change existing records, or enable sending.
2. Deploy the reviewed code. Until the migration exists, the private page displays setup guidance while ordinary inquiry storage remains available. Do not apply this migration to an unrelated project or resume a paused environment unnecessarily.
3. Add these **server-only** settings to the production deployment through the hosting provider's secure environment editor. Do not put real values into Git, browser client code, logs, or chat:

| Variable | Purpose |
| --- | --- |
| `GMAIL_CLIENT_ID` | Dedicated Google web OAuth client for Orbisy's mailbox connection |
| `GMAIL_CLIENT_SECRET` | Its confidential client secret |
| `FOLLOWUP_TOKEN_ENCRYPTION_KEY` | Base64-encoded random 32-byte AES key; generate securely and retain it for this connection |
| `FOLLOWUP_CRON_SECRET` | Random secret of at least 32 characters for the worker bearer header |
| `FOLLOWUP_RESEND_WEBHOOK_SECRET` | Signing secret from the specific Resend webhook endpoint |
| `FOLLOWUP_UNSUBSCRIBE_SECRET` | Independent random secret of at least 32 characters for signed preference links |
| `FOLLOWUP_POSTAL_ADDRESS` | Owner-confirmed business mailing address included in reminder emails |
| `FOLLOWUP_SEND_ENABLED` | Keep `false` during setup; enable only after controlled testing and owner approval |

Reuse the existing verified `RESEND_API_KEY` and `RESEND_FROM_EMAIL`; do not replace working owner-notification settings. All customer replies use `Reply-To: info@orbisy.com`. Keep Google Workspace as the mailbox provider; no MX change is needed.

4. In the intended Google Cloud project, enable Gmail API, configure the OAuth audience/consent and any Google-required verification or Workspace approval, and create a web client. Use exactly `https://www.orbisy.com/api/admin/followups/gmail/callback` as the authorized redirect URI. Request only `https://www.googleapis.com/auth/gmail.metadata`. Follow Google's current requirements for this restricted scope; do not bypass warnings. The administrator signs into Orbisy as before, then uses the connection button and authorizes `info@orbisy.com` in Google's secure UI. The user's Gmail password is never entered into Orbisy.
5. Configure a Resend webhook for `https://www.orbisy.com/api/followups/delivery` with `email.delivered`, `email.bounced`, `email.complained`, and `email.failed`. Its signing secret must match the production setting. Confirm delivery and replay handling with controlled test events; the dashboard's 'configuration present' label does not prove this external setup works.
6. Configure a protected POST request to `https://www.orbisy.com/api/internal/followups` every five minutes using a suitable existing scheduler, such as Supabase Cron invoking an HTTP request. Store the bearer secret in the scheduler's secure secret mechanism (for example Supabase Vault); never embed it into public SQL or URLs. Header: `Authorization: Bearer <FOLLOWUP_CRON_SECRET>`. No recurring job is created automatically in this PR. Confirm successful job runs and monitor failures. A worker failure returns 503; expected disabled/locked states return 200 with an explicit status.
7. Connect Gmail with sending switches off. Run the worker to verify metadata sync while outbound sending remains off. Test a known inquiry, a reply arriving before enrollment, an owner-sent response, manual pause, reopening, suppression, delivery events, and stop links. Test through the same deployment/domain you intend to use.
8. Review templates and the business address. Enable the server gate only after review, with the administrator sending switch initially off; explicitly enable approved sending for a controlled test before real new-inquiry enrollment. Then enable fresh-inquiry enrollment and optional automatic acknowledgment. Reminders continue to require individual approval. Digest delivery is separately opt-in.

## Operational limits

- Gmail polling is not instantaneous. A message already claimed/sending cannot be recalled; pause stops future claims. Check Gmail personally before approving a reminder.
- Matching conservatively pauses the one open conversation for an exact contact email. Aliases, different reply addresses, or forwarded conversations may require the manual Record a reply control. This first version does not reconstruct Gmail threads or copy message bodies into Orbisy.
- Bookings stop through the existing consultation/client status or the Close / meeting booked control; no calendar provider is connected automatically.
- An expired Gmail history cursor requires reconnection and manual review. Reconnection deliberately pauses all existing open conversations and resets enrollment/sending; it does not silently skip missed replies and resume.
- Template changes affect future drafts. An email's payload is frozen at its first attempt; editing a sent/attempted email or retrying it after the safe window is deliberately blocked. Review uncertain sends in Resend before any personal resend.
- The UI shows up to 50 recent conversations and 200 recent matching/system events, not a complete historical export. Readiness labels report configuration presence, not external-service certification.
- Token-encryption key rotation requires disconnecting/reconnecting the mailbox. Revoking Google access can also be done in Google Account. Local disconnect pauses/blocks even if the provider revocation request is unavailable.
- No real email, Gmail connection, or production mutation is used in automated tests. External operations are mocked. The initial production target is identified during review, but the additive migration and activation remain a later approved step.

Primary implementation references:
- https://developers.google.com/identity/protocols/oauth2/web-server
- https://developers.google.com/workspace/gmail/api/auth/scopes
- https://developers.google.com/workspace/gmail/api/guides/sync
- https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.history/list
- https://resend.com/docs/webhooks/verify-webhooks-requests
- https://docs.svix.com/receiving/verifying-payloads/how-manual
- https://resend.com/docs/dashboard/emails/idempotency-keys
