// @vitest-environment node
import { describe, expect, it } from "vitest";
import { assertSameRegistrableDomain, discoverUsefulPages, robotsAllowsPath } from "./discovery";

describe("bounded audit page discovery", () => {
  it("selects useful same-domain pages and rejects unrelated links", () => {
    const pages = discoverUsefulPages("https://www.example.com/", `
      <a href="https://example.com/contact">Contact</a><a href="/services">Services</a>
      <a href="/about">About</a><a href="https://unrelated.example.net/contact">Other</a>
      <a href="/admin">Admin</a>`, 3);
    expect(pages.map((page) => page.pageType)).toEqual(["contact", "services"]);
  });
  it("allows canonical www changes but blocks different registrable domains", () => {
    expect(() => assertSameRegistrableDomain(new URL("https://example.com/path"), "example.com")).not.toThrow();
    expect(() => assertSameRegistrableDomain(new URL("https://evil.example.net/"), "example.com")).toThrow("cross_domain_destination");
  });
  it("uses the longest matching robots rule", () => {
    const robots = "User-agent: *\nDisallow: /private\nAllow: /private/public";
    expect(robotsAllowsPath(robots, "/private/report")).toBe(false);
    expect(robotsAllowsPath(robots, "/private/public/page")).toBe(true);
    expect(robotsAllowsPath("User-agent: *\nDisallow: /*.pdf$", "/files/report.pdf")).toBe(false);
    expect(robotsAllowsPath("User-agent: *\nDisallow: /*.pdf$", "/files/report.pdf?download=1")).toBe(true);
  });
});
