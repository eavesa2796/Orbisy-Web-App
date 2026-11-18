import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
import { GoogleAnalyticsConsent } from "./google-analytics-consent";
import { AnalyticsChoice } from "./analytics-choice";
import { GOOGLE_CONSENT_KEY } from "@/lib/analytics/google";
import { ANALYTICS_OPTOUT_KEY } from "@/lib/analytics/privacy";
beforeEach(() => {
  route.pathname = "/";
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("Google Analytics visitor choice", () => {
  it("requires a separate explicit choice even when inquiry attribution was allowed", () => {
    window.localStorage.setItem(ANALYTICS_OPTOUT_KEY, "false");
    render(<GoogleAnalyticsConsent />);
    expect(
      screen.getByRole("heading", { name: "Optional Google Analytics" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Allow Google Analytics" }),
    );
    expect(window.localStorage.getItem(GOOGLE_CONSENT_KEY)).toBe("granted");
    expect(
      screen.queryByRole("button", { name: "Allow Google Analytics" }),
    ).not.toBeInTheDocument();
  });
  it("can decline without disabling inquiry attribution", () => {
    render(<GoogleAnalyticsConsent />);
    fireEvent.click(
      screen.getByRole("button", { name: "Continue without Google Analytics" }),
    );
    expect(window.localStorage.getItem(GOOGLE_CONSENT_KEY)).toBe("denied");
    expect(window.localStorage.getItem(ANALYTICS_OPTOUT_KEY)).toBeNull();
  });
  it("provides an accessible way to withdraw permission and does not restore it when inquiry attribution is allowed again", () => {
    window.localStorage.setItem(GOOGLE_CONSENT_KEY, "granted");
    render(<AnalyticsChoice />);
    fireEvent.click(
      screen.getByRole("button", { name: "Opt out of analytics and attribution" }),
    );
    expect(window.localStorage.getItem(GOOGLE_CONSENT_KEY)).toBe("denied");
    expect(
      screen.getByRole("button", { name: "Allow Google Analytics" }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Allow inquiry attribution" }),
    );
    expect(window.localStorage.getItem(GOOGLE_CONSENT_KEY)).toBe("denied");
    expect(
      screen.getByRole("button", { name: "Allow Google Analytics" }),
    ).toBeEnabled();
  });
  it("does not display a consent banner on private routes", () => {
    for (const pathname of [
      "/admin-portal",
      "/auth/reset-password",
      "/preview/tools",
    ]) {
      route.pathname = pathname;
      const { container, unmount } = render(<GoogleAnalyticsConsent />);
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });
});
