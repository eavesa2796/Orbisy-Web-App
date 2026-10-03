import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  captureInquiryAttribution,
  setAnalyticsOptOut,
  trackEvent,
} from "@/components/analytics-provider";
import { ATTRIBUTION_KEY } from "@/lib/attribution";
beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});
afterEach(() => vi.unstubAllGlobals());
describe("Optional inquiry attribution", () => {
  it("retains the initial landing and campaign while updating the submission page", () => {
    window.history.replaceState(
      {},
      "",
      "/campaigns/local-google-ads?utm_source=google&utm_campaign=local",
    );
    expect(captureInquiryAttribution()?.landingPath).toBe(
      "/campaigns/local-google-ads",
    );
    window.history.replaceState({}, "", "/google-ads");
    expect(captureInquiryAttribution()).toMatchObject({
      landingPath: "/campaigns/local-google-ads",
      submissionPath: "/google-ads",
      utmSource: "google",
      utmCampaign: "local",
    });
  });
  it("clears attribution on opt-out and avoids capture for DNT or GPC", () => {
    captureInquiryAttribution();
    setAnalyticsOptOut(true);
    expect(window.sessionStorage.getItem(ATTRIBUTION_KEY)).toBeNull();
    expect(captureInquiryAttribution()).toBeUndefined();
    setAnalyticsOptOut(false);
    vi.stubGlobal("navigator", { doNotTrack: "1" });
    expect(captureInquiryAttribution()).toBeUndefined();
    vi.stubGlobal("navigator", { globalPrivacyControl: true });
    expect(captureInquiryAttribution()).toBeUndefined();
  });
  it("keeps optional analytics errors out of the saved inquiry experience", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
      throw new Error("Storage blocked");
    });
    expect(() =>
      trackEvent("project_request_form_submit_success"),
    ).not.toThrow();
    vi.restoreAllMocks();
  });
});
