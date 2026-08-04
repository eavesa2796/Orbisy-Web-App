import { describe, expect, it } from "vitest";
import {
  containsUnsupportedImpactClaim,
  findingDisplayText,
} from "./policy";

describe("Phase Five outreach policy", () => {
  it("rejects unsupported monetary and revenue-loss claims", () => {
    expect(containsUnsupportedImpactClaim("This is costing you $50,000 per year.")).toBe(true);
    expect(containsUnsupportedImpactClaim("You are losing revenue every month.")).toBe(true);
    expect(containsUnsupportedImpactClaim("This may create friction for some visitors.")).toBe(false);
  });

  it("uses administrator-reviewed wording when available", () => {
    expect(findingDisplayText({
      administratorExplanation: "Verified administrator wording.",
      originalExplanation: "Original automated wording.",
    })).toBe("Verified administrator wording.");
  });
});
