"use client";

import { useEffect } from "react";
import type { analyticsEventNames } from "@/lib/analytics";

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

const SESSION_KEY = "orbisy_analytics_session";
const OPTOUT_KEY = "orbisy_analytics_opt_out";

function shouldTrack() {
  if (typeof window === "undefined") return false;
  if (window.localStorage.getItem(OPTOUT_KEY) === "true") return false;
  if (navigator.doNotTrack === "1") return false;
  if ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl)
    return false;
  return !window.location.pathname.startsWith("/admin-portal");
}

function getSessionId() {
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function getDeviceCategory() {
  const width = window.innerWidth;
  return width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop";
}

function getViewportCategory() {
  const width = window.innerWidth;
  return width < 640 ? "small" : width < 1100 ? "medium" : "large";
}

export function trackEvent(eventName: AnalyticsEventName, componentId?: string) {
  if (!shouldTrack()) return;

  const url = new URL(window.location.href);
  let referrerDomain: string | undefined;
  try {
    referrerDomain = document.referrer
      ? new URL(document.referrer).hostname
      : undefined;
  } catch {
    referrerDomain = undefined;
  }

  const body = JSON.stringify({
    eventName,
    sessionId: getSessionId(),
    pagePath: url.pathname,
    referrerDomain,
    utmSource: url.searchParams.get("utm_source")?.slice(0, 100) || undefined,
    utmMedium: url.searchParams.get("utm_medium")?.slice(0, 100) || undefined,
    utmCampaign: url.searchParams.get("utm_campaign")?.slice(0, 100) || undefined,
    deviceCategory: getDeviceCategory(),
    viewportCategory: getViewportCategory(),
    componentId,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/analytics",
      new Blob([body], { type: "application/json" }),
    );
  } else {
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  }
}

export function AnalyticsProvider() {
  useEffect(() => {
    if (!shouldTrack()) return;
    trackEvent("page_view");

    const milestones = new Set<number>();
    const onScroll = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
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
      details.forEach((element) => element.removeEventListener("toggle", onToggle));
      observer.disconnect();
    };
  }, []);

  return null;
}

export function setAnalyticsOptOut(optOut: boolean) {
  window.localStorage.setItem(OPTOUT_KEY, String(optOut));
  if (optOut) window.sessionStorage.removeItem(SESSION_KEY);
}

export function getAnalyticsOptOut() {
  return (
    typeof window !== "undefined" &&
    window.localStorage.getItem(OPTOUT_KEY) === "true"
  );
}
