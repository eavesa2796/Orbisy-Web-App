// Inventory of the browser storage used by the current website implementation.
// Do not put cookie values, session tokens, or live visitor data in this table.
export const browserStorageDisclosures = [
  {
    name: "_ga", type: "Cookie · optional Google Analytics",
    purpose: "Helps Google Analytics distinguish browsers after you allow Google Analytics.",
    duration: "Configured for up to 90 days; browser limits or clearing cookies can shorten this.",
    choice: "Requires a separate Google Analytics grant. Declining or withdrawing prevents future Google collection through this integration.",
  },
  {
    name: "_ga_DZQMLKQDTE", type: "Cookie · optional Google Analytics",
    purpose: "Maintains session information for Orbisy’s Google Analytics property.",
    duration: "Configured for up to 90 days, without renewal on every event. Browser limits may shorten this.",
    choice: "Requires Google Analytics permission. Withdrawal attempts to clear this property’s accessible analytics cookies.",
  },
  {
    name: "orbisy_google_analytics_consent_v1", type: "Local storage · preference",
    purpose: "Remembers whether you allowed or declined Google Analytics in this browser.",
    duration: "Until you change the choice or this browser’s site storage is cleared; no automatic expiry is set.",
    choice: "Created when you make a choice. Clearing site storage resets the remembered choice; Google permission is not assumed.",
  },
  {
    name: "orbisy_analytics_opt_out", type: "Local storage · preference",
    purpose: "Remembers your opt-out from optional reporting, including Orbisy’s own reporting and Google Analytics.",
    duration: "Until changed or this browser’s site storage is cleared; no automatic expiry is set.",
    choice: "Controlled by the analytics choices below. Allowing first-party reporting again does not automatically grant Google permission.",
  },
  {
    name: "orbisy_analytics_session", type: "Session storage · first-party reporting",
    purpose: "Keeps a random identifier for limited, first-party website interaction reports. It is not attached to your saved inquiry.",
    duration: "Normally the browser tab’s session, subject to browser restore behavior. Removed by Orbisy when you opt out of analytics.",
    choice: "Used unless you opt out or a supported browser privacy signal blocks optional reporting.",
  },
  {
    name: "orbisy_inquiry_attribution", type: "Session storage · optional inquiry attribution",
    purpose: "Keeps the initial public landing path, referring domain, and permitted campaign labels so they can accompany a later inquiry.",
    duration: "Normally the browser tab’s session, subject to browser restore behavior. Removed by Orbisy when you opt out of analytics.",
    choice: "Blocked by analytics opt-out, Do Not Track, and Global Privacy Control. Your inquiry can still be saved without it.",
  },
  {
    name: "Supabase authentication cookies (sb-…-auth-token and related entries)", type: "Cookies · administrator sign-in",
    purpose: "Maintain and refresh an authorized administrator’s sign-in session. Cookie names can include a project identifier or numbered parts.",
    duration: "Managed by the authentication service and its session settings; cookies may renew while signed in and change or clear on sign-out or expiry.",
    choice: "Used for administrator authentication, separately from optional visitor analytics. Blocking these can prevent administrator sign-in.",
  },
] as const;
