import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PricingPage, { metadata } from "@/app/pricing/page";
import {
  findPublicPackage,
  publicPackages,
  supportingOffers,
  subscriptionPlans,
} from "@/lib/public-pricing";

describe("Public pricing and package selection", () => {
  it("publishes scoped prices with separate ad spend and discoverable package links", async () => {
    const html = renderToStaticMarkup(
      await PricingPage({ searchParams: Promise.resolve({}) }),
    );
    for (const offer of [...subscriptionPlans, ...publicPackages, ...supportingOffers]) {
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
  it("shows monthly plans before individual services and carries each selection into the inquiry", async () => {
    const html = renderToStaticMarkup(await PricingPage({ searchParams: Promise.resolve({}) }));
    const document = new DOMParser().parseFromString(html, "text/html");
    const cards = [...document.querySelectorAll("#monthly-plans .subscription-plan")];
    expect(cards.map((card) => card.querySelector("h3")?.textContent)).toEqual(["Starter", "Growth", "Complete"]);
    expect(html.indexOf('id="monthly-plans"')).toBeLessThan(html.indexOf('id="packages"'));
    expect(html).toContain("$299");
    expect(html).toContain("$999");
    expect(html).toContain("$2,499");
    expect(html).toContain("Four hours of custom development each month");
    expect(html).toContain("do not add the standalone management fee again");
    for (const plan of subscriptionPlans) {
      const selected = renderToStaticMarkup(await PricingPage({ searchParams: Promise.resolve({ package: plan.id }) }));
      const page = new DOMParser().parseFromString(selected, "text/html");
      expect(page.querySelector('select[name="serviceNeeded"]')?.querySelector('option[selected]')?.textContent).toBe(plan.service);
      expect(page.body.textContent).toContain(`Requested package: ${plan.name} (${plan.priceSummary}).`);
      expect(page.querySelector('.inquiry-package-context')?.textContent).toBe(`Requested package: ${plan.name} (${plan.priceSummary}).`);
      expect(page.querySelector('[name="projectDescription"]')?.getAttribute("maxLength")).toBe(String(3000 - `Requested package: ${plan.name} (${plan.priceSummary}).`.length - 2));
    }
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
