import { googleCampaignParameters, measurementPageContext } from "./measurement";
import { analyticsEventNames, analyticsEventSchema } from "@/lib/analytics";
import {
  ANALYTICS_CHOICE_EVENT,
  browserPrivacyBlocked,
  publicAnalyticsPage,
} from "./privacy";

export const GOOGLE_MEASUREMENT_ID = "G-DZQMLKQDTE";
export const GOOGLE_CONSENT_KEY = "orbisy_google_analytics_consent_v1";
export const GOOGLE_SCRIPT_ID = "orbisy-google-analytics";
type Gtag = (...args: unknown[]) => void;
type GoogleWindow = Window &
  typeof globalThis & {
    dataLayer?: unknown[];
    gtag?: Gtag;
    "ga-disable-G-DZQMLKQDTE"?: boolean;
  };
const disabledKey = "ga-disable-G-DZQMLKQDTE";
const canonicalOrigin = "https://www.orbisy.com";
let initialized = false;
let previousPage: string | undefined;
let lastPage: string | undefined;
let currentReferrer = "";
function gw() {
  return window as GoogleWindow;
}
export function getGoogleConsent(): "unset" | "granted" | "denied" {
  if (typeof window === "undefined") return "unset";
  try {
    const choice = window.localStorage.getItem(GOOGLE_CONSENT_KEY);
    return choice === "granted" || choice === "denied" ? choice : "unset";
  } catch {
    return "denied";
  }
}
export function googlePrivacyBlocked() {
  return browserPrivacyBlocked();
}
export function canSendGoogleAnalytics() {
  return (
    typeof window !== "undefined" &&
    ["orbisy.com", "www.orbisy.com"].includes(window.location.hostname) &&
    window.location.protocol === "https:" &&
    !!publicAnalyticsPage(window.location.pathname) &&
    !browserPrivacyBlocked() &&
    getGoogleConsent() === "granted"
  );
}
function clearGoogleCookies() {
  // Only this property's known first-party GA cookies; do not clear authentication cookies.
  const names = ["_ga", "_ga_DZQMLKQDTE"];
  const domains = ["", window.location.hostname, "orbisy.com", ".orbisy.com"];
  for (const name of names)
    for (const domain of domains)
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure${domain ? `; Domain=${domain}` : ""}`;
}
export function suspendGoogleAnalytics(clearCookies = false) {
  if (typeof window === "undefined") return;
  gw()[disabledKey] = true;
  initialized = false;
  lastPage = undefined;
  previousPage = undefined;
  currentReferrer = "";
  // Remove unprocessed commands on withdrawal/private navigation; do not replay denied activity.
  if (gw().dataLayer) gw().dataLayer!.length = 0;
  if (clearCookies) {
    try { clearGoogleCookies(); } catch { /* Restricted cookies must not interrupt preferences. */ }
  }
}
export function setGoogleConsent(consent: "granted" | "denied") {
  try {
    window.localStorage.setItem(GOOGLE_CONSENT_KEY, consent);
  } catch {
    suspendGoogleAnalytics(true);
    return;
  }
  if (consent === "denied" || browserPrivacyBlocked())
    suspendGoogleAnalytics(true);
  window.dispatchEvent(new Event(ANALYTICS_CHOICE_EVENT));
}
function safeReferrer() {
  try {
    return document.referrer ? new URL(document.referrer).origin + "/" : "";
  } catch {
    return "";
  }
}
function context() {
  const page = publicAnalyticsPage(window.location.pathname)!;
  return {
    ...measurementPageContext(page.path),
    page_location: canonicalOrigin + page.path,
    page_title: `Orbisy | ${page.title}`,
    page_referrer: currentReferrer || safeReferrer(),
  };
}
function initialize() {
  if (!canSendGoogleAnalytics()) return false;
  const target = gw();
  target[disabledKey] = false;
  if (initialized) return true;
  target.dataLayer ??= [];
  target.gtag ??= function () {
    // Match Google’s documented queue format, including commands before script load.
    // eslint-disable-next-line prefer-rest-params
    target.dataLayer!.push(arguments);
  };
  const gtag = target.gtag;
  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  gtag("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  gtag("js", new Date());
  gtag("config", GOOGLE_MEASUREMENT_ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_flags: "SameSite=Lax;Secure",
    cookie_expires: 90 * 24 * 60 * 60,
    cookie_update: false,
    ...context(),
    ...googleCampaignParameters(new URL(window.location.href)),
  });
  if (document.getElementById(GOOGLE_SCRIPT_ID)) {
    initialized = true;
    return true;
  }
  const script = document.createElement("script");
  script.id = GOOGLE_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_MEASUREMENT_ID}`;
  script.onerror = () => {
    suspendGoogleAnalytics();
    script.remove();
    initialized = false;
  };
  initialized = true;
  document.head.appendChild(script);
  return true;
}
export function trackGooglePage() {
  try {
    if (!canSendGoogleAnalytics()) {
      suspendGoogleAnalytics(browserPrivacyBlocked());
      return;
    }
    if (!initialize()) return;
    const page = publicAnalyticsPage(window.location.pathname)!;
    if (lastPage === page.path) return;
    currentReferrer = previousPage || safeReferrer();
    const payload = context();
    gw().gtag!("set", payload);
    gw().gtag!("event", "page_view", {
      send_to: GOOGLE_MEASUREMENT_ID,
      ...payload,
    });
    previousPage = payload.page_location;
    lastPage = page.path;
  } catch {
    /* Optional reporting never interrupts navigation. */
  }
}
export function trackGoogleEvent(
  eventName: (typeof analyticsEventNames)[number],
  componentId?: string,
) {
  try {
    if (!canSendGoogleAnalytics()) {
      suspendGoogleAnalytics(browserPrivacyBlocked());
      return;
    }
    if (eventName === "page_view" || !analyticsEventNames.includes(eventName))
      return;
    // Ensure the current page is recorded before its interaction, without replaying earlier events.
    trackGooglePage();
    if (!initialized) return;
    const form = eventName.startsWith("project_request_form_")
      ? "project_request"
      : eventName.startsWith("homepage_review_form_")
        ? "website_review"
        : undefined;
    const name = eventName.endsWith("_form_submit_success")
      ? "generate_lead"
      : eventName;
    const component =
      componentId &&
      analyticsEventSchema.shape.componentId.safeParse(componentId).success
        ? componentId
        : undefined;
    gw().gtag!("event", name, {
      send_to: GOOGLE_MEASUREMENT_ID,
      ...context(),
      ...(form ? { form_type: form } : {}),
      ...(component ? { component_id: component } : {}),
    });
  } catch {
    /* Storage, script, and network errors must not affect saved inquiries. */
  }
}
