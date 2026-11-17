"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  getGoogleConsent,
  googlePrivacyBlocked,
  setGoogleConsent,
} from "@/lib/analytics/google";
import {
  ANALYTICS_CHOICE_EVENT,
  isPrivateAnalyticsPath,
} from "@/lib/analytics/privacy";
export function subscribeAnalyticsChoices(callback: () => void) {
  window.addEventListener(ANALYTICS_CHOICE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(ANALYTICS_CHOICE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
export function googleChoiceSnapshot() {
  return googlePrivacyBlocked() ? "blocked" : getGoogleConsent();
}
export function GoogleAnalyticsConsent() {
  const pathname = usePathname();
  const choice = useSyncExternalStore(
    subscribeAnalyticsChoices,
    googleChoiceSnapshot,
    () => "denied",
  );
  if (isPrivateAnalyticsPath(pathname) || choice !== "unset") return null;
  return (
    <aside
      className="google-analytics-consent"
      aria-labelledby="google-consent-heading"
    >
      <div>
        <h2 id="google-consent-heading">Optional Google Analytics</h2>
        <p>
          Orbisy uses limited first-party reporting. With your permission,
          Google Analytics also helps us understand visits and project inquiries
          using analytics cookies. Your choice does not affect contacting
          Orbisy.
        </p>
        <Link href="/privacy#analytics-settings">
          Privacy & analytics choices
        </Link>
      </div>
      <div className="google-consent-actions">
        <button
          type="button"
          className="button button-small"
          onClick={() => setGoogleConsent("granted")}
        >
          Allow Google Analytics
        </button>
        <button
          type="button"
          className="button button-small button-secondary"
          onClick={() => setGoogleConsent("denied")}
        >
          Continue without Google Analytics
        </button>
      </div>
    </aside>
  );
}
