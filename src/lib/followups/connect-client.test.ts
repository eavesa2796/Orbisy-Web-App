import {afterEach, expect, it, vi} from "vitest";
import {getGmailAuthorizationUrl} from "./connect-client";

afterEach(() => vi.unstubAllGlobals());

it("requests a same-origin authorization URL without fetching Google across origins", async () => {
  const url = "https://accounts.google.com/o/oauth2/v2/auth?client_id=fictional&state=fictional-state";
  const request = vi.fn().mockResolvedValue(Response.json({authorizationUrl:url}));
  vi.stubGlobal("fetch", request);
  await expect(getGmailAuthorizationUrl()).resolves.toBe(url);
  expect(request).toHaveBeenCalledExactlyOnceWith("/api/admin/followups/gmail/start", expect.objectContaining({
    method:"POST", headers:{Accept:"application/json"}, credentials:"same-origin", cache:"no-store",
  }));
});

it.each([[401, /session has expired/], [409, /settings are not ready/], [500, /could not start/]] as const)
  ("explains a %s response instead of silently staying on the page", async (status, message) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, {status})));
    await expect(getGmailAuthorizationUrl()).rejects.toThrow(message);
  });

it("explains a network failure and allows the owner to retry", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));
  await expect(getGmailAuthorizationUrl()).rejects.toThrow("Could not reach Orbisy");
});

it.each([
  "https://untrusted.example/",
  "https://accounts.google.com.untrusted.example/o/oauth2/v2/auth",
  "https://accounts.google.com/other",
  "javascript:alert(1)",
])("rejects an unexpected navigation destination: %s", async authorizationUrl => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({authorizationUrl})));
  await expect(getGmailAuthorizationUrl()).rejects.toThrow("unexpected Google connection response");
});

it("handles an invalid server response without displaying its raw contents", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("untrusted response text")));
  await expect(getGmailAuthorizationUrl()).rejects.toThrow("unexpected Google connection response");
});
