// @vitest-environment node
import {expect, it} from "vitest";
import {unstable_getResponseFromNextConfig} from "next/experimental/testing/server";
import nextConfig from "../../../next.config";

async function headersFor(path: string) {
  const response = await unstable_getResponseFromNextConfig({
    url: `https://www.orbisy.com${path}`,
    nextConfig,
  });
  return response.headers;
}

function directives(headers: Headers) {
  return headers.get("content-security-policy")!.split("; ");
}

it("permits the Google redirect after the inbox's same-origin OAuth form submission", async () => {
  const inbox = await headersFor("/admin-portal/followups");
  expect(directives(inbox)).toContain("form-action 'self' https://accounts.google.com");

  const publicHeaders = await headersFor("/");
  expect(directives(inbox).filter(value => !value.startsWith("form-action ")))
    .toEqual(directives(publicHeaders).filter(value => !value.startsWith("form-action ")));
  expect(inbox.get("x-frame-options")).toBe("DENY");
  expect(inbox.get("x-content-type-options")).toBe("nosniff");
});

it.each(["/", "/contact", "/admin-portal", "/admin-portal/leads", "/admin-portal/followups/other", "/api/admin/followups/gmail/start"])
  ("keeps form submissions on the same origin for %s", async path => {
    expect(directives(await headersFor(path))).toContain("form-action 'self'");
  });
