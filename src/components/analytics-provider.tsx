"use client";

import { usePathname } from "next/navigation";
import {
  ATTRIBUTION_KEY,
  attributionSchema,
  sanitizeAttribution,
} from "@/lib/attribution";
import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import {
  browserPrivacyBlocked,
  isPrivateAnalyticsPath,
  ANALYTICS_OPTOUT_KEY,
  ANALYTICS_CHOICE_EVENT,
} from "@/lib/analytics/privacy";
import {
  setGoogleConsent,
  suspendGoogleAnalytics,
  trackGooglePage,
  trackGoogleEvent,
} from "@/lib/analytics/google";
import {
  subscribeAnalyticsChoices,
  googleChoiceSnapshot,
} from "@/components/google-analytics-consent";
import type { analyticsEventNames } from "@/lib/analytics";

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

const SESSION_KEY = "orbisy_analytics_session";
const OPTOUT_KEY = ANALYTICS_OPTOUT_KEY;

export function shouldTrack() {
  return (
    typeof window !== "undefined" &&
    !browserPrivacyBlocked() &&
    !isPrivateAnalyticsPath(window.location.pathname)
  );
}

export function trackEvent(eventName: AnalyticsEventName, componentId?: string) {
  try {
    if (shouldTrack()) trackGoogleEvent(eventName, componentId);
  } catch {
    /* Optional Google reporting never interrupts navigation or saved inquiries. */
  }
}

export function AnalyticsProvider() {
  const pathname = usePathname();
  const googleChoice = useSyncExternalStore(
    subscribeAnalyticsChoices,
    googleChoiceSnapshot,
    () => "denied",
  );
  useLayoutEffect(() => {
    trackGooglePage();
  }, [pathname, googleChoice]);
  useEffect(() => {
    try { window.sessionStorage.removeItem(SESSION_KEY); } catch { /* Retired identifier cleanup is best effort. */ }
    captureInquiryAttribution();
    if (!shouldTrack()) return;

    const milestones = new Set<number>();
    const onScroll = () => {
      const available =
        document.documentElement.scrollHeight - window.innerHeight;
      if (available <= 0) return;
      const percent = Math.round((window.scrollY / available) * 100);
      ([25, 50, 75, 90] as const).forEach((point) => {
        if (percent >= point && !milestones.has(point)) {
          milestones.add(point);
          trackEvent(`scroll_${point}` as AnalyticsEventName);
        }
      });
    };

    const onToggle = (event: Event) => {
      const details = event.target as HTMLDetailsElement;
      if (details.open && details.matches("[data-faq-index]")) {
        trackEvent("faq_expand");
      }
    };

    const viewed = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = (entry.target as HTMLElement).dataset.analyticsView;
          if (!id || viewed.has(id)) return;
          viewed.add(id);
          trackEvent(
            id.startsWith("service_") ? "service_view" : "audience_view",
            id,
          );
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.5 },
    );

    document.addEventListener("scroll", onScroll, { passive: true });
    const details = document.querySelectorAll("details[data-faq-index]");
    details.forEach((element) => element.addEventListener("toggle", onToggle));
    document
      .querySelectorAll<HTMLElement>("[data-analytics-view]")
      .forEach((element) => observer.observe(element));

    return () => {
      document.removeEventListener("scroll", onScroll);
      details.forEach((element) =>
        element.removeEventListener("toggle", onToggle),
      );
      observer.disconnect();
    };
  }, [pathname, googleChoice]);

  return null;
}

export function setAnalyticsOptOut(optOut: boolean) {
  try {
    window.localStorage.setItem(OPTOUT_KEY, String(optOut));
    if (optOut) {
      window.sessionStorage.removeItem(SESSION_KEY);
      window.sessionStorage.removeItem(ATTRIBUTION_KEY);
      setGoogleConsent("denied");
    }
  } catch {
    suspendGoogleAnalytics(true);
  }
  window.dispatchEvent(new Event(ANALYTICS_CHOICE_EVENT));
}

export function getAnalyticsOptOut() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(OPTOUT_KEY) === "true";
  } catch {
    return true;
  }
}

export function captureInquiryAttribution() {
  try {
    if (!shouldTrack()) {
      window.sessionStorage.removeItem(ATTRIBUTION_KEY);
      return undefined;
    }
    const current = sanitizeAttribution(
      new URL(window.location.href),
      document.referrer,
    );
    if (!current) return undefined;
    const stored = attributionSchema.safeParse(
      JSON.parse(window.sessionStorage.getItem(ATTRIBUTION_KEY) || "null"),
    );
    const attribution = stored.success
      ? { ...stored.data, submissionPath: current.submissionPath }
      : current;
    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
    return attribution;
  } catch {
    return undefined;
  }
}
