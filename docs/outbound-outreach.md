# Reviewed association outreach

The private `/admin-portal/outreach` workspace manages individual business introductions from `info@orbisy.com`. It is separate from the existing inbound inquiry flow and legacy manual audit briefs. It does not scrape contacts, auto-enroll imported leads, purchase lists, or send through Resend.

## First setup

1. Apply the generated `0013_outbound_outreach` migration to the verified database target. The five new tables have RLS and revoke PUBLIC, anon, and authenticated access; application server operations enforce administrator authorization.
2. Set `OUTREACH_SEND_ENABLED=true` only on the production deployment. This is a deployment gate, not campaign activation. Database sending starts false.
3. Open Outreach and connect sending with Google as the business mailbox. This grants `gmail.send` and `gmail.metadata` using a separate encrypted refresh-token record. It reuses the existing OAuth client and callback URI; no new redirect URI is necessary. The inbound connection and its settings are preserved.
4. Create a draft campaign, then add a prospect with a source page, actual contact basis, and specific relevance notes. A public address does not establish consent. The administrator must ensure the intended contact complies with applicable law and Google’s rules, which prohibit unsolicited mass email.
5. Open each prospect, personalize all three messages, and approve that complete sequence. Activate the campaign. Review the sending rules and enable sending only when ready to contact the approved recipients.

No campaign or prospect is created or activated by the migration. Setup and deployment do not authorize sending to an unspecified list.

## Schedule and controls

- Initial daily limit: five total attempts across all campaigns, including follow-ups. Adjustable from one to ten.
- Weekdays, 9 a.m.–5 p.m. America/Chicago. This is separate from Orbisy’s personal-response hours.
- At least ten minutes between dispatches. One message at most per worker invocation.
- First follow-up: three weekdays after the introduction is accepted by Gmail. Final follow-up: four weekdays after the first follow-up is accepted. Weekday timing does not incorporate a holiday calendar.
- The existing five-minute worker endpoint invokes the separate outreach worker. Existing inbound response fields remain compatible; outreach status is included separately.
- Draft, paused, and archived campaigns do not send. Global pause preserves queued work; pausing a prospect cancels its pending messages. An in-flight email cannot be recalled.
- Each email includes truthful sender information, a business-solicitation label, configured postal address, linked Orbisy logo, and signed stop link. GET requests never unsubscribe; the confirmation button or supported provider one-click POST saves the preference.
- Suppression, changed lead status/address, an existing inbound conversation, stale/backlogged mailbox synchronization, or a sequence approval older than 30 days blocks sending.

## Delivery, responses, and uncertainty

The provider is the Gmail API. A stored first-attempt marker and frozen MIME payload commit before the external send. A message is claimed once. The API has no application idempotency key, so ambiguous failures and interrupted sends are not retried automatically. The sequence pauses and the administrator must check Gmail Sent before continuing personally. Definite API rejections are also surfaced for review.

Gmail acceptance is not proof of inbox delivery. Reply detection uses message metadata, not bodies. A matching personal sent message, human reply, or automatic/delivery notification stops the sequence. Automatic notifications do not count as human replies. An unmatched identifiable delivery notification pauses account-wide outreach for review. Shared do-not-contact records are checked immediately before dispatch. Opt-out signatures are scoped separately from inbound links and remain valid for 90 days.

Reconnecting outreach pauses approved sequences and global sending. Disconnecting outreach locally does not revoke the shared Google OAuth client, since a provider-wide revocation could also disable the inbound connection. An administrator can revoke the application through Google Account if desired.

## Data and review

Sources, contact basis, relevance notes, approved drafts, attempt timestamps, provider identifiers, events, and suppression records persist in the private database. Tokens are encrypted and neither tokens nor raw MIME are serialized to the browser. No open-tracking pixels are added. Sales outcomes continue to use the existing lead/client workflow. The privacy page describes the additional outbound permission and processing.

A read-only fictional design preview is available at `/preview/outreach` in development and Vercel preview deployments only. It never accesses the database or mailbox and its submission controls are disabled.

References:
- https://developers.google.com/workspace/gmail/api/guides/sending
- https://developers.google.com/workspace/gmail/api/auth/scopes
- https://workspace.google.com/intl/en/terms/use_policy/
- https://resend.com/legal/acceptable-use
- https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
