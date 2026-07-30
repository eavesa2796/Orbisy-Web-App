"use client";

import { useSyncExternalStore } from "react";
import {
  getAnalyticsOptOut,
  setAnalyticsOptOut,
} from "@/components/analytics-provider";

export function AnalyticsChoice() {
  const optedOut = useSyncExternalStore(
    (callback) => {
      window.addEventListener("orbisy-analytics-choice", callback);
      return () => window.removeEventListener("orbisy-analytics-choice", callback);
    },
    getAnalyticsOptOut,
    () => false,
  );

  return (
    <div className="analytics-choice">
      <button
        className="button button-small"
        type="button"
        onClick={() => {
          setAnalyticsOptOut(!optedOut);
          window.dispatchEvent(new Event("orbisy-analytics-choice"));
        }}
      >
        {optedOut ? "Allow anonymous analytics" : "Opt out of analytics"}
      </button>
      <span>{optedOut ? "Analytics are disabled on this device." : "Analytics are currently allowed."}</span>
    </div>
  );
}
