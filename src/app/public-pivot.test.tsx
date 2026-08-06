import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import RestaurantsPage, { metadata as restaurantMetadata } from "@/app/restaurants/page";
import HaulersPage, { metadata as haulerMetadata } from "@/app/haulers/page";
import manifest from "@/app/manifest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("Phase 1 public messaging", () => {
  it("presents the managed records service without unsupported promises", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("Know what was serviced.");
    expect(html).toContain("Request a Grease-Record Review");
    expect(html).toContain("Current pilots are delivered as a managed service");
    expect(html).toContain("Planned software direction");
    expect(html).toContain("Grease Haulers");
    expect(html).toContain("does not provide legal or regulatory advice");
    expect(html).not.toContain("Anthony Eaves, the developer behind Orbisy");
    expect(html).not.toContain("Guarantee compliance");
    expect(html).not.toContain("Free homepage review");
    expect(html).not.toContain("Concept Project");
  });

  it("renders dedicated restaurant and hauler paths", () => {
    const restaurantHtml = renderToStaticMarkup(<RestaurantsPage />);
    const haulerHtml = renderToStaticMarkup(<HaulersPage />);
    expect(restaurantHtml).toContain("Independent history across haulers");
    expect(restaurantHtml).toContain("not a working customer portal");
    expect(restaurantHtml).toContain("restaurant-portal-location-concept.webp");
    expect(haulerHtml).toContain("possible ten-account, 30-day pilot");
    expect(haulerHtml).toContain("not a working customer portal");
    expect(haulerHtml).toContain("hauler-portal-overview-concept.webp");
    expect(restaurantMetadata.alternates).toEqual({ canonical: "/restaurants" });
    expect(haulerMetadata.alternates).toEqual({ canonical: "/haulers" });
  });

  it("publishes the new routes consistently", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain("http://localhost:3000/restaurants");
    expect(urls).toContain("http://localhost:3000/haulers");
    expect(robots().rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ allow: expect.arrayContaining(["/restaurants", "/haulers"]) }),
    ]));
    expect(manifest().description).toContain("grease-interceptor service records");
  });
});
