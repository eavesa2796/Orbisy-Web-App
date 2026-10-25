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
import { industries } from "@/lib/industries";
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
  it("leads with the process artwork only in the hero carousel", () => {
    const page = new DOMParser().parseFromString(renderToStaticMarkup(<Home />), "text/html");
    const heroSlides = [...page.querySelectorAll(".hero-project .portfolio-slide")];
    const workSlides = [...page.querySelectorAll("#work .portfolio-slide")];
    expect(heroSlides.map((slide) => slide.getAttribute("aria-label"))).toEqual([
      "1 of 4: The Orbisy design process", "2 of 4: Rescue Battery Shop", "3 of 4: Rescue Tow Truck", "4 of 4: Orbisy operations dashboard",
    ]);
    expect(workSlides.map((slide) => slide.getAttribute("aria-label"))).toEqual([
      "1 of 4: Rescue Battery Shop", "2 of 4: Rescue Tow Truck", "3 of 4: The Orbisy design process", "4 of 4: Orbisy operations dashboard",
    ]);
  });

  it("links each related service as a complete card with its own graphic", () => {
    for (const current of engagements) {
      const page = new DOMParser().parseFromString(renderToStaticMarkup(<EngagementPage engagement={current} />), "text/html");
      const cards = [...page.querySelectorAll(".related-service-card")];
      expect(cards.map((card) => card.getAttribute("href"))).toEqual(engagements.filter((item) => item.slug !== current.slug).map((item) => `/${item.slug}`));
      expect(new Set(cards.map((card) => card.querySelector(".service-art-blueprint path")?.getAttribute("d"))).size).toBe(5);
    }
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
    expect(html).toContain("orbisy-about-battery-portfolio.webp");
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
      "/automated-follow-up",
      "/website-maintenance",
      "/industries",
      ...industries.map((industry) => `/industries/${industry.slug}`),
      "/towing-marketing",
      "/work",
      "/pricing",
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
