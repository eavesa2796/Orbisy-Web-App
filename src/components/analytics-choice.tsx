"use client";

import { setGoogleConsent } from "@/lib/analytics/google";
import {
  googleChoiceSnapshot,
  subscribeAnalyticsChoices,
} from "@/components/google-analytics-consent";
import { useSyncExternalStore } from "react";
import {
  getAnalyticsOptOut,
  setAnalyticsOptOut,
} from "@/components/analytics-provider";

export function AnalyticsChoice() {
  const optedOut = useSyncExternalStore(
    subscribeAnalyticsChoices,
    getAnalyticsOptOut,
    () => false,
  );
  const googleChoice = useSyncExternalStore(
    subscribeAnalyticsChoices,
    googleChoiceSnapshot,
    () => "denied",
  );

  return (
    <div className="analytics-choice" id="analytics-settings">
      <h3>First-party reporting</h3>
      <button
        className="button button-small"
        type="button"
        onClick={() => {
          setAnalyticsOptOut(!optedOut);
        }}
      >
        {optedOut ? "Allow first-party reporting" : "Opt out of all analytics"}
      </button>
      <span>
        {optedOut
          ? "Optional reporting is disabled on this device."
          : "Limited first-party reporting is allowed unless your browser signals otherwise."}
      </span>
      <h3>Optional Google Analytics</h3>
      <p>
        {googleChoice === "blocked"
          ? "Google Analytics is blocked by your analytics opt-out or browser privacy signal."
          : googleChoice === "granted"
            ? "You have allowed Google Analytics on this device."
            : "Google Analytics is not enabled on this device."}
      </p>
      <div className="google-consent-actions">
        <button
          className="button button-small"
          type="button"
          disabled={googleChoice === "blocked"}
          onClick={() => setGoogleConsent("granted")}
        >
          Allow Google Analytics
        </button>
        <button
          className="button button-small button-secondary"
          type="button"
          onClick={() => setGoogleConsent("denied")}
        >
          Decline Google Analytics
        </button>
      </div>
      <p>
        Declining Google Analytics keeps your inquiry form available. Opting out
        of analytics above also withdraws Google Analytics permission and clears
        this property’s accessible Google Analytics cookies.
      </p>
    </div>
  );
}
