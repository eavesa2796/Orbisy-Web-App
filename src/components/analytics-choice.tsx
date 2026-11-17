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
      <h3>Inquiry source attribution</h3>
      <button
        className="button button-small"
        type="button"
        onClick={() => {
          setAnalyticsOptOut(!optedOut);
        }}
      >
        {optedOut ? "Allow inquiry attribution" : "Opt out of analytics and attribution"}
      </button>
      <span>
        {optedOut
          ? "Optional analytics and inquiry attribution are disabled on this device."
          : "Limited inquiry source details can accompany a saved inquiry unless you opt out or your browser signals otherwise. Orbisy no longer collects its own page-view or click reports."}
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
        above also withdraws Google Analytics permission and clears
        this property’s accessible Google Analytics cookies.
      </p>
    </div>
  );
}
