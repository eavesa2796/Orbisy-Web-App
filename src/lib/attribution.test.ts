import { describe, expect, it } from "vitest";
import { sanitizeAttribution, attributionSchema } from "@/lib/attribution";
describe("Privacy-aware campaign labels", () => {
  it("keeps only permitted paths, bounded labels, and referring host", () => {
    const result = sanitizeAttribution(
      new URL(
        "https://orbisy.com/google-ads?utm_source=google&utm_campaign=local&gclid=private-click&email=private@example.com#contact",
      ),
      "https://referrer.example/path?email=person@example.com",
    );
    expect(result).toEqual({
      landingPath: "/google-ads",
      submissionPath: "/google-ads",
      referrerDomain: "referrer.example",
      utmSource: "google",
      utmCampaign: "local",
    });
  });
  it("rejects private paths and drops unsafe or oversized campaign strings", () => {
    expect(
      sanitizeAttribution(
        new URL("https://orbisy.com/admin-portal/pricing"),
        "",
      ),
    ).toBeUndefined();
    expect(
      attributionSchema.safeParse({
        landingPath: "/",
        submissionPath: "/?secret=123",
      }).success,
    ).toBe(false);
    const result = sanitizeAttribution(
      new URL(
        `https://orbisy.com/?utm_source=person@example.com&utm_campaign=${"a".repeat(101)}`,
      ),
      "",
    );
    expect(result?.utmSource).toBeUndefined();
    expect(result?.utmCampaign).toBeUndefined();
  });
});
