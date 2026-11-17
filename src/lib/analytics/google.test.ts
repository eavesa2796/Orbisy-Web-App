import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const realWindow = window;
let google: typeof import("./google");
let location: {
  hostname: string;
  protocol: string;
  pathname: string;
  href: string;
};
let fakeWindow: Record<string, unknown>;
function commands() {
  return ((fakeWindow.dataLayer || []) as Array<ArrayLike<unknown>>).map(
    (entry) => Array.from(entry),
  );
}
beforeEach(async () => {
  vi.resetModules();
  realWindow.localStorage.clear();
  document.getElementById("orbisy-google-analytics")?.remove();
  location = {
    hostname: "www.orbisy.com",
    protocol: "https:",
    pathname: "/",
    href: "https://www.orbisy.com/?email=private@example.test#private",
  };
  fakeWindow = {
    location,
    localStorage: realWindow.localStorage,
    sessionStorage: realWindow.sessionStorage,
    dispatchEvent: realWindow.dispatchEvent.bind(realWindow),
  };
  vi.stubGlobal("window", fakeWindow);
  vi.stubGlobal("navigator", { doNotTrack: "0", globalPrivacyControl: false });
  google = await import("./google");
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.getElementById("orbisy-google-analytics")?.remove();
});
describe("Consent-gated Google Analytics", () => {
  it("does not insert the tag or queue any Google commands before explicit consent or after decline", () => {
    google.trackGooglePage();
    google.trackGoogleEvent("primary_cta_click");
    expect(document.getElementById(google.GOOGLE_SCRIPT_ID)).toBeNull();
    expect(commands()).toHaveLength(0);
    google.setGoogleConsent("denied");
    google.trackGooglePage();
    expect(document.getElementById(google.GOOGLE_SCRIPT_ID)).toBeNull();
    expect(commands()).toHaveLength(0);
  });
  it("loads one tag and manually records one pageview per public navigation", () => {
    google.setGoogleConsent("granted");
    google.trackGooglePage();
    google.trackGooglePage();
    expect(
      document.querySelectorAll(`#${google.GOOGLE_SCRIPT_ID}`),
    ).toHaveLength(1);
    expect(
      commands().filter((c) => c[0] === "event" && c[1] === "page_view"),
    ).toHaveLength(1);
    location.pathname = "/member-portals";
    google.trackGooglePage();
    const views = commands().filter(
      (c) => c[0] === "event" && c[1] === "page_view",
    );
    expect(views).toHaveLength(2);
    expect(views[1][2]).toMatchObject({
      page_location: "https://www.orbisy.com/member-portals",
      page_referrer: "https://www.orbisy.com/",
    });
    const config = commands().find((c) => c[0] === "config")!;
    expect(config[1]).toBe("G-DZQMLKQDTE");
    expect(config[2]).toMatchObject({
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
  });
  it("excludes query strings, fragments, full referrers, arbitrary component labels and form contents", () => {
    vi.spyOn(document, "referrer", "get").mockReturnValue(
      "https://referral.example/private?email=hidden@example.test",
    );
    google.setGoogleConsent("granted");
    google.trackGoogleEvent(
      "project_request_form_submit_success",
      "person@example.test",
    );
    const lead = commands().find(
      (c) => c[0] === "event" && c[1] === "generate_lead",
    )!;
    expect(lead[2]).toMatchObject({
      form_type: "project_request",
      page_location: "https://www.orbisy.com/",
      page_referrer: "https://referral.example/",
    });
    expect(lead[2]).not.toHaveProperty("component_id");
    const data = JSON.stringify(commands());
    expect(data).not.toMatch(
      /private@|hidden@|person@|sessionId|projectDescription|query/,
    );
    expect(data).not.toContain("#private");
  });
  it.each([
    "/admin-portal",
    "/admin-portal/leads/secret",
    "/auth/callback",
    "/api/analytics",
    "/preview/workspace",
    "/unknown/member-email",
  ])("blocks Google on %s even with stored consent", (path) => {
    google.setGoogleConsent("granted");
    location.pathname = path;
    google.trackGooglePage();
    google.trackGoogleEvent("project_request_form_submit_success");
    expect(document.getElementById(google.GOOGLE_SCRIPT_ID)).toBeNull();
    expect(commands()).toHaveLength(0);
    expect(fakeWindow["ga-disable-G-DZQMLKQDTE"]).toBe(true);
  });
  it.each(["doNotTrack", "globalPrivacyControl", "optOut", "storageBlocked"])(
    "respects %s above a stored Google grant",
    (signal) => {
      google.setGoogleConsent("granted");
      if (signal === "doNotTrack")
        vi.stubGlobal("navigator", { doNotTrack: "1" });
      if (signal === "globalPrivacyControl")
        vi.stubGlobal("navigator", { globalPrivacyControl: true });
      if (signal === "optOut")
        realWindow.localStorage.setItem("orbisy_analytics_opt_out", "true");
      if (signal === "storageBlocked")
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
          throw Error("blocked");
        });
      google.trackGooglePage();
      expect(document.getElementById(google.GOOGLE_SCRIPT_ID)).toBeNull();
      expect(commands()).toHaveLength(0);
    },
  );
  it("disables a loaded tag immediately on private navigation and consent withdrawal, and permits a fresh grant", () => {
    const cookie = vi.spyOn(document, "cookie", "set");
    google.setGoogleConsent("granted");
    google.trackGooglePage();
    location.pathname = "/admin-portal/settings";
    google.trackGooglePage();
    expect(fakeWindow["ga-disable-G-DZQMLKQDTE"]).toBe(true);
    expect(commands()).toHaveLength(0);
    google.setGoogleConsent("denied");
    expect(
      cookie.mock.calls.every(([value]) => /^_ga(?:_DZQMLKQDTE)?=/.test(value)),
    ).toBe(true);
    location.pathname = "/about";
    google.trackGooglePage();
    expect(commands()).toHaveLength(0);
    google.setGoogleConsent("granted");
    google.trackGooglePage();
    expect(fakeWindow["ga-disable-G-DZQMLKQDTE"]).toBe(false);
    expect(
      document.querySelectorAll(`#${google.GOOGLE_SCRIPT_ID}`),
    ).toHaveLength(1);
    expect(
      commands().filter((c) => c[0] === "event" && c[1] === "page_view"),
    ).toHaveLength(1);
  });
  it("does not pollute the production property from localhost or preview hosts", () => {
    google.setGoogleConsent("granted");
    for (const host of ["localhost", "orbisy-preview.vercel.app"]) {
      location.hostname = host;
      google.trackGooglePage();
    }
    expect(document.getElementById(google.GOOGLE_SCRIPT_ID)).toBeNull();
  });
  it("keeps a blocked script failure out of navigation and inquiry handling", () => {
    google.setGoogleConsent("granted");
    google.trackGooglePage();
    const script = document.getElementById(google.GOOGLE_SCRIPT_ID)!;
    expect(() => script.dispatchEvent(new Event("error"))).not.toThrow();
    expect(document.getElementById(google.GOOGLE_SCRIPT_ID)).toBeNull();
    expect(fakeWindow["ga-disable-G-DZQMLKQDTE"]).toBe(true);
  });
});
