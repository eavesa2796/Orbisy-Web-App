export type ToolGuide = {
  title: string;
  href: string;
  role: "Everyday" | "Optional" | "Advanced";
  purpose: string;
  fit: string;
  skip: string;
  steps: string[];
  outcome: string;
  terms: [string, string][];
};
export const adminToolGuides = {
  clients: {
    title: "Client workspaces",
    href: "/admin-portal/clients",
    role: "Everyday",
    purpose:
      "Keep an organization’s contacts, systems, scope, next action, discovery briefs, and milestones together.",
    fit: "Your main workspace for association website, member portal, and integration projects.",
    skip: "Keep early inquiries in Leads until there is enough context to create a client workspace.",
    steps: [
      "Search for the organization before creating a workspace.",
      "Link its existing inquiry so the original message and lead history stay available.",
      "Record current systems, scope, access references, and a dated next action. Use password-manager references rather than secrets.",
      "Capture discovery, milestones, and decisions as the project moves forward. Update the proposal status manually.",
    ],
    outcome:
      "A current client record and a clear next step. Creating a workspace does not send a proposal or accept a contract.",
    terms: [
      [
        "Discovery brief",
        "An internal scope-planning document. Ready for review is not client approval.",
      ],
      [
        "Archived",
        "Kept in history but excluded from active work queues. Restore the status in Edit details when needed.",
      ],
    ],
  },
  leads: {
    title: "Inquiries & leads",
    href: "/admin-portal/leads",
    role: "Everyday",
    purpose:
      "Read incoming project requests and track conversations, follow-ups, and outcomes.",
    fit: "Use this for association inquiries, referrals, and the real businesses already in Orbisy’s pipeline.",
    skip: "The prospecting and audit steps are optional. An inbound request can move directly to a conversation and client workspace.",
    steps: [
      "Search by organization, contact, or domain before adding another record.",
      "Open a lead to read its original inquiry, source, and notes.",
      "Set its pipeline status and a follow-up; record decisions after each conversation.",
      "Create or link a client workspace once you begin discovery. For outbound research only, use the website-check workflow.",
    ],
    outcome:
      "An up-to-date conversation record. Saving a draft or logging contact does not send an email.",
    terms: [
      [
        "Inbound",
        "Someone contacted Orbisy. Read their request before deciding the next step.",
      ],
      [
        "Outreach brief / Phase 5",
        "A private draft based on reviewed findings, approved for manual use. You still send the message separately.",
      ],
      [
        "Suppressed",
        "Excluded from outreach and relevant research/import steps. Do not treat it as an active prospect.",
      ],
    ],
  },
  pricing: {
    title: "Private pricing catalog",
    href: "/admin-portal/pricing",
    role: "Everyday",
    purpose:
      "Keep internal service scopes, billing approaches, fees, add-ons, and notes for preparing quotes.",
    fit: "Use it to scope websites, portals, integrations, and separately agreed ongoing development.",
    skip: "Archive old advertising or SEO entries when they no longer represent an offer. Nothing is archived automatically.",
    steps: [
      "Filter existing entries before adding templates or creating another entry.",
      "Describe the deliverables, exclusions, and billing basis. Leave amounts blank until you choose an actual rate.",
      "Use draft while reviewing, active for current internal options, and archived for retired offers.",
      "Prepare a project-specific quote from the agreed scope; this catalog does not issue invoices or publish rates.",
    ],
    outcome:
      "A private reference for quoting, not a subscription checkout or client contract.",
    terms: [
      [
        "Unset amount",
        "No rate chosen. A blank amount is different from a zero-dollar service.",
      ],
      ["Active", "Available internally. It does not make an entry public."],
    ],
  },
  notifications: {
    title: "Inquiry email status",
    href: "/admin-portal/notifications",
    role: "Everyday",
    purpose:
      "Check whether the email alert for a saved inquiry was accepted by the email provider.",
    fit: "Useful whenever a website inquiry appears in Leads but its email alert is missing.",
    skip: "No action is needed for an accepted alert unless you are investigating delivery. This is not an outbound campaign tool.",
    steps: [
      "Open the linked lead first to read and respond to the saved inquiry.",
      "Check the alert status, attempt time, and error. Fix sender/provider configuration if the error points there.",
      "Use Retry notification only for the alert that needs it. Wait at least one minute; interrupted attempts become retryable after ten minutes.",
      "For an ambiguous timeout beyond the provider’s 24-hour deduplication window, check the provider log before retrying to avoid a duplicate alert.",
    ],
    outcome:
      "A retried administrator alert. Failed email does not remove the saved inquiry, and accepted does not prove inbox delivery.",
    terms: [
      [
        "Sent",
        "Accepted by the provider, not confirmed as read or delivered to an inbox.",
      ],
      [
        "Retry",
        "Attempts the notification again; it does not create another lead or send a sales reply.",
      ],
    ],
  },
  imports: {
    title: "CSV imports",
    href: "/admin-portal/imports",
    role: "Optional",
    purpose:
      "Bring a permitted list of organizations into Leads, with validation and duplicate review before confirmation.",
    fit: "Useful if you intentionally research a short, relevant list of associations. It is not necessary for incoming requests or existing client work.",
    skip: "Skip this if you do not maintain a prospect list. It is not a membership-platform integration or a member-data import tool.",
    steps: [
      "Download the template or choose a CSV you are permitted to use. Use one organization per row; Business name can contain an association’s name.",
      "Match each CSV header to the right field. Business name is required; map website and source details when available.",
      "Create import preview. This stores a batch for review; it does not yet add ready rows to Leads.",
      "Inspect the row preview, download rejected rows if needed, then Confirm ready rows. Handle uncertain matches in Duplicate review separately.",
    ],
    outcome:
      "Confirmed organizations become leads. No preflight check, audit, or outreach email starts just because you import a list.",
    terms: [
      [
        "Column mapping",
        "Tells Orbisy which spreadsheet column contains each field.",
      ],
      [
        "Source identifier",
        "A stable record ID from your source, if available. It helps recognize repeated imports.",
      ],
      [
        "Ready",
        "Passed import validation and can be confirmed. It does not mean a sales-qualified prospect.",
      ],
      [
        "Suppressed",
        "Matched a do-not-contact entry; excluded from confirmation.",
      ],
    ],
  },
  review: {
    title: "Duplicate review",
    href: "/admin-portal/imports/review",
    role: "Optional",
    purpose:
      "Resolve import rows that may match an existing organization or need a manual decision.",
    fit: "Use only when a CSV import leaves uncertain rows. It protects the pipeline from repeated or inappropriate records.",
    skip: "A clear queue needs no action. Do not import a questionable match as new just to empty the queue.",
    steps: [
      "Read Why flagged and open the possible existing lead, if one is linked.",
      "Compare the organization name, website, location, and contact details against the source.",
      "Choose Skip to leave the row out, Mark duplicate for an existing record, or Fill missing fields to supplement the matched lead without replacing filled fields.",
      "Use Import as new only after confirming it is a separate organization. Suppress records that should be excluded. Add a decision note and Record decision.",
    ],
    outcome:
      "A recorded decision for that row. Some choices create or update a lead immediately; this is not a preview-only menu.",
    terms: [
      ["Skip", "Does not add this candidate to Leads."],
      [
        "Fill missing fields",
        "Updates missing values on the matched lead while retaining its existing populated fields.",
      ],
      [
        "Suppress",
        "Creates a do-not-contact exclusion; it is not a way to postpone ordinary review.",
      ],
    ],
  },
  preflight: {
    title: "Website checks (preflight)",
    href: "/admin-portal/preflight",
    role: "Optional",
    purpose:
      "Run a bounded public-website check and compare a prospect with the saved target-industry and location rules.",
    fit: "Useful for optional association prospect research. The old local-business target rules may reject good association prospects, so review Settings first.",
    skip: "Skip it for normal client delivery and member-system discovery. It cannot inspect a private portal, verify API access, or evaluate an integration.",
    steps: [
      "Review target industries, locations, and check controls in Settings. Enabling a switch alone does not schedule a worker.",
      "In Leads, select a small group and choose Queue selected for website checks.",
      "Return here to watch the job status; open a row to read reachability checks, the Business Fit Score, and audit eligibility.",
      "If eligible and a deeper public-site review is useful, queue it separately in Website audits. If blocked or failed, inspect the reason before considering Retry.",
    ],
    outcome:
      "A saved check and eligibility decision. Passing does not start a deep audit or contact the organization.",
    terms: [
      [
        "Queued / running",
        "Waiting for a configured worker / currently being processed. A queue that never advances may need worker configuration.",
      ],
      [
        "Retry scheduled",
        "Waiting for the next allowed attempt; repeated clicking does not fix the cause.",
      ],
      [
        "Blocked / failed",
        "A safety/policy condition or unsuccessful check needs review. This is not proof that the website is poor.",
      ],
      [
        "DNS / HTTP / robots",
        "DNS resolves the domain, HTTP is the server response, and robots rules may limit automated access. These are reachability checks, not a measure of design quality.",
      ],
      [
        "Passed / skipped / cancelled",
        "Passed completed the checks; skipped did not perform the normal check; cancelled stops a waiting job. Read the detail record rather than treating all as a website verdict.",
      ],
      [
        "Business Fit Score",
        "A rule-based match to configured prospecting criteria. Higher means a better rules match, not a probability of buying.",
      ],
      [
        "Eligibility override",
        "An administrator’s reasoned eligibility decision. It does not bypass suppression or network safeguards.",
      ],
    ],
  },
  audits: {
    title: "Website audits",
    href: "/admin-portal/audits",
    role: "Optional",
    purpose:
      "Inspect a limited set of public pages and review evidence of possible website improvements.",
    fit: "Can support redesign discovery or researched outreach. It is not an association case study, a full accessibility assessment, or a member-platform integration test.",
    skip: "Skip when discovery with the client is more useful. Existing contacted/client pipeline states may be excluded by the prospecting policy; do not change their status just to force an audit.",
    steps: [
      "Start with an eligible website-check result. Select a bounded set in the Eligible view and Queue selected audits.",
      "Wait for a configured audit worker, then open a completed result. Read Pages inspected or skipped and Audit Confidence before using the score.",
      "Check each finding against its evidence: Verify if supported, Reject if wrong, or Edit wording to make it accurate. Clearly label manual observations.",
      "Complete review and recalculate after resolving pending findings. If ready for a manual outreach brief, open the lead to prepare it; nothing is emailed automatically.",
    ],
    outcome:
      "A limited, reviewed improvement record. A higher Website Improvement Score means more identified opportunities, not a healthier website or guaranteed return.",
    terms: [
      [
        "Completed with warnings",
        "The run finished with limits or unavailable checks; inspect coverage before drawing conclusions.",
      ],
      [
        "Severity / confidence",
        "Severity describes the finding’s importance; confidence describes the supporting evidence. Neither predicts sales or financial loss.",
      ],
      [
        "Verify / reject / edit",
        "Verify only a supported finding; reject an incorrect one. Edit wording requires an administrator explanation. Review changes can make prior briefs stale.",
      ],
      [
        "Provisional",
        "Automated findings have not yet completed administrator review.",
      ],
      [
        "Audit Confidence",
        "How much usable evidence and coverage the review has. Low confidence limits what you can reasonably conclude.",
      ],
      [
        "Ready for manual brief / Phase 5",
        "Review and confidence checks allow draft preparation on the lead. It does not send a message or establish client approval.",
      ],
      [
        "Reopen review",
        "Use when evidence or conclusions change. Related approved briefs can become stale and need reapproval.",
      ],
    ],
  },
  suppressions: {
    title: "Do-not-contact list",
    href: "/admin-portal/suppressions",
    role: "Everyday",
    purpose:
      "Record identifiers that should be excluded from imports and the prospecting workflow.",
    fit: "Keep this when using prospect lists or manual outreach so opt-outs and exclusions remain visible.",
    skip: "Do not use suppression to archive a completed client or pause a project; use the client or lead status appropriate to that situation.",
    steps: [
      "Choose the identifier type: email, domain, phone, or a source’s stable record ID.",
      "Enter the matching value and a clear reason. A domain exclusion is broader than one person’s email.",
      "Add the entry, then review it in Active entries. Entries do not expire automatically.",
      "Before any manual contact, check the lead and exclusions. Sending from another email app cannot be prevented by this portal.",
    ],
    outcome:
      "An exclusion record. It does not delete a lead, erase history, or unsubscribe someone from unrelated external services.",
    terms: [
      [
        "Domain",
        "An organization’s website domain; check the scope before blocking it.",
      ],
      [
        "Source identifier",
        "The stable ID supplied by the original data source.",
      ],
      [
        "Removal",
        "This screen has no removal control. A mistaken exclusion needs a deliberate administrator data correction, not a replacement prospect record.",
      ],
    ],
  },
  analytics: {
    title: "Website analytics",
    href: "/admin-portal/analytics",
    role: "Everyday",
    purpose:
      "See aggregate public-site traffic, interactions, and tracked successful form submissions.",
    fit: "Use it to check whether visitors explore association services and reach the consultation flow.",
    skip: "It cannot identify organizations or members, explain why a visitor left, or replace the saved lead records when counting actual inquiries.",
    steps: [
      "Choose a 7-, 30-, or 90-day window and compare trends over a useful period.",
      "Look at Top pages and Interactions to see which content and calls to action receive activity.",
      "Use tracked submissions as a directional signal, then open Leads to review the actual saved inquiries and their fit.",
      "Allow for consent choices, privacy signals, blockers, and repeat page views. Do not treat sessions as unique people or clicks as customers.",
    ],
    outcome:
      "A directional view of website use. A saved inquiry can exist without an analytics event when tracking is declined or blocked. Optional Google Analytics is a separate visitor-choice-based report; its totals can differ from this first-party dashboard.",
    terms: [
      ["Page views", "Tracked page loads, including repeats."],
      [
        "Anonymous sessions",
        "Distinct temporary session identifiers in the reporting window, not verified people.",
      ],
      [
        "Direct",
        "No referrer domain was captured; it does not prove the visitor typed the URL.",
      ],
      [
        "Tracked submissions",
        "Success events emitted after saving a form, when tracking is allowed. Leads is the source for saved inquiry records.",
      ],
    ],
  },
  settings: {
    title: "Settings & operating controls",
    href: "/admin-portal/settings",
    role: "Advanced",
    purpose:
      "Review configuration presence, prospecting rules, import limits, and background website-check controls.",
    fit: "Review legacy industry and location rules before using prospect research for associations. Website, portal, and integration delivery do not require these workers.",
    skip: "Leave technical limits unchanged unless you are diagnosing a specific issue. Configuration presence is not a successful connection test.",
    steps: [
      "Read Configuration presence to distinguish core website requirements from optional research services.",
      "Review the saved target rules. They influence prospect matching, not the public website, and are not automatically changed to the new association positioning.",
      "Change only the settings you understand. Field explanations show units, effects, and controls that are stored but not currently enforced.",
      "Save settings deliberately. Switches allow processing but do not create an external schedule; secrets are configured in hosting, not entered here.",
    ],
    outcome:
      "Saved operating preferences, not a worker deployment, credential test, or automatic data cleanup.",
    terms: [
      [
        "Worker",
        "A separately invoked background process that consumes queued jobs.",
      ],
      [
        "Enabled",
        "Allows the related processing when other requirements are met. Unchecked disables that stage.",
      ],
      [
        "ms / bytes",
        "1,000 milliseconds is one second; 1,000,000 bytes is about 1 MB.",
      ],
      [
        "Retention setting",
        "A stored preference here; no automatic import or audit deletion task is implemented by these controls.",
      ],
    ],
  },
} satisfies Record<string, ToolGuide>;
export type AdminToolKey = keyof typeof adminToolGuides;
