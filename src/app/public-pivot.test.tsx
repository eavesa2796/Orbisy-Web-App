import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import TowingPage, {
  metadata as towingMetadata,
} from "@/app/towing-marketing/page";
import { engagements } from "@/lib/engagements";
import { EngagementPage } from "@/components/engagement-page";
import { generateMetadata as campaignMetadata } from "@/app/campaigns/[offer]/page";
import WorkPage from "@/app/work/page";
import manifest from "@/app/manifest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { analyticsEventSchema } from "@/lib/analytics";

describe("Orbisy agency public site", () => {
  it("provides full engagement details and service-prefilled inquiries", () => {
    for (const engagement of engagements) {
      const html = renderToStaticMarkup(
        <EngagementPage engagement={engagement} />,
      );
      expect(html).toContain("What we need from you");
      expect(html).toContain("How pricing works");
      expect(html).toContain(engagement.service);
      expect(html).toContain("Know what you’re buying.");
    }
    expect(renderToStaticMarkup(<WorkPage />)).toContain("<h1>");
  });
  it("limits campaign pages to explicit offers and keeps them noindex", async () => {
    expect(
      (
        await campaignMetadata({
          params: Promise.resolve({ offer: "towing-websites" }),
        })
      ).robots,
    ).toEqual({ index: false, follow: true });
    for (const offer of ["unknown", "constructor", "toString"]) {
      await expect(
        campaignMetadata({ params: Promise.resolve({ offer }) }),
      ).rejects.toThrow();
    }
  });
  it("offers all four services and a project inquiry without presenting the archived product", () => {
    const html = renderToStaticMarkup(<Home />);
    for (const label of [
      "Website projects",
      "Google Ads",
      "Local SEO",
      "Custom development",
      "Request a consultation",
    ]) {
      expect(html).toContain(label);
    }
    expect(html).toContain('id="contact"');
    expect(html).toContain('href="/towing-marketing"');
    expect(html).toContain("orbisy-about.webp");
    expect(html).not.toContain("Request a Records Review");
    expect(html).not.toContain("grease-interceptor");
    expect(html).not.toContain('href="/restaurants"');
    expect(html).not.toContain('href="/haulers"');
  });

  it("provides towing-specific services with its own canonical and contact flow", () => {
    const html = renderToStaticMarkup(<TowingPage />);
    expect(html).toContain("Towing &amp; roadside assistance");
    expect(html).toContain("coverage");
    expect(html).toContain('id="contact"');
    expect(html).toContain("Google Ads / PPC management");
    expect(towingMetadata.alternates).toEqual({
      canonical: "/towing-marketing",
    });
    expect(towingMetadata.openGraph).toMatchObject({
      url: "/towing-marketing",
    });
  });

  it("keeps private and archived pages out of public discovery", () => {
    const paths = sitemap().map((entry) => new URL(entry.url).pathname);
    expect(paths).toEqual([
      "/",
      "/web-design",
      "/google-ads",
      "/local-seo",
      "/custom-development",
      "/towing-marketing",
      "/work",
      "/privacy",
      "/terms",
    ]);
    expect(robots().rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          allow: expect.arrayContaining(["/towing-marketing"]),
          disallow: ["/admin-portal", "/api/", "/auth/", "/campaigns/"],
        }),
      ]),
    );
    expect(manifest().description).toContain("Web design");
  });

  it("accepts every service and audience tracking identifier rendered by the new pages", () => {
    const html =
      renderToStaticMarkup(<Home />) + renderToStaticMarkup(<TowingPage />);
    const ids = [...html.matchAll(/data-analytics-view="([^"]+)"/g)].map(
      (match) => match[1],
    );
    ids.push(
      "hero_project_request",
      "hero_towing",
      "nav_project_request",
      "towing_project_request",
      "footer_email",
    );
    for (const componentId of ids) {
      expect(
        analyticsEventSchema.safeParse({
          eventName: "primary_cta_click",
          sessionId: "550e8400-e29b-41d4-a716-446655440000",
          pagePath: "/",
          componentId,
        }).success,
        componentId,
      ).toBe(true);
    }
  });
});
