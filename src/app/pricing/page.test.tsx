import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PricingPage, { metadata } from "@/app/pricing/page";
import {
  findPublicPackage,
  publicPackages,
  supportingOffers,
} from "@/lib/public-pricing";

describe("Public pricing and package selection", () => {
  it("publishes scoped prices with separate ad spend and discoverable package links", async () => {
    const html = renderToStaticMarkup(
      await PricingPage({ searchParams: Promise.resolve({}) }),
    );
    for (const offer of [...publicPackages, ...supportingOffers]) {
      expect(html).toContain(offer.price);
      expect(html).toContain(`/pricing?package=${offer.id}#contact`);
    }
    expect(html).toContain("$750 one-time setup");
    expect(html).toContain("first month’s Orbisy fees are $1,250");
    expect(html).toContain("Ad spend is paid directly to Google");
    expect(html).toContain("Quoted separately");
    expect(html).not.toContain("Most popular");
    expect(metadata.alternates).toEqual({ canonical: "/pricing" });
  });
  it("prefills the service and preserves the selected offer as inquiry context", async () => {
    const html = renderToStaticMarkup(
      await PricingPage({
        searchParams: Promise.resolve({ package: "google-ads" }),
      }),
    );
    expect(html).toContain('selected="">Google Ads / PPC management');
    expect(html).toContain(
      "Requested package: Google Ads ($750 setup + $500/month management; ad spend separate).",
    );
    expect(html).toContain('name="projectDescription"');
    expect(html).toContain('name="consent"');
  });
  it("only accepts public package identifiers, never arbitrary inquiry text", async () => {
    for (const value of [
      "unknown",
      "constructor",
      ["landing-page", "google-ads"],
      "<script>alert(1)</script>",
      undefined,
    ]) {
      expect(findPublicPackage(value)).toBeUndefined();
    }
    const html = renderToStaticMarkup(
      await PricingPage({
        searchParams: Promise.resolve({ package: "private-internal-price" }),
      }),
    );
    expect(html).not.toContain("private-internal-price");
    expect(html).not.toContain("Requested package:");
  });
});
