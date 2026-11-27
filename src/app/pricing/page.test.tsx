import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PricingPage, { metadata } from "@/app/pricing/page";
import { findPublicPackage, publicPackages, supportingOffers } from "@/lib/public-pricing";
describe("Association pricing", () => {
 it("renders current planning ranges and the limited published care price", async () => {
 const html = renderToStaticMarkup(await PricingPage({searchParams: Promise.resolve({})}));
 for (const offer of [...publicPackages, ...supportingOffers]) expect(html).toContain(`/pricing?package=${offer.id}#contact`);
 const text = new DOMParser().parseFromString(html, "text/html").body.textContent;
 for (const offer of publicPackages) {
   expect(text).toContain(offer.price);
   expect(offer.billing).toContain("planning range");
 }
 expect(text).toContain("One-time USD planning ranges");
 expect(html).toContain("$125"); expect(html).toContain("Up to 30 minutes");
 for (const retired of ["$299", "$999", "$2,499", "Google Ads", "Local SEO"]) expect(html).not.toContain(retired);
 expect(metadata.alternates).toEqual({canonical: "/pricing"});
 });
 it("carries every valid selected scope and service into the inquiry", async () => {
 for (const offer of [...publicPackages,...supportingOffers]) {
 const html = renderToStaticMarkup(await PricingPage({searchParams: Promise.resolve({package: offer.id})}));
 const doc = new DOMParser().parseFromString(html,"text/html");
 expect(doc.querySelector('select[name="serviceNeeded"] option[selected]')?.textContent).toBe(offer.service);
 expect(doc.querySelector(".inquiry-package-context")?.textContent).toBe(`Requested scope: ${offer.name} (${offer.priceSummary}).`);
 }
 });
 it("rejects retired, private, unknown and array selections", () => {
 for (const value of ["google-ads", "starter", "growth", "complete", "local-search-foundation", "constructor", ["integration"], "private-internal-price", undefined]) expect(findPublicPackage(value)).toBeUndefined();
 });
});
