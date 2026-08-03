// @vitest-environment node
import { describe, expect, it } from "vitest";
import { calculateWebsiteImprovement, scoreBand } from "./scoring";
import { calculateAuditConfidence } from "./confidence";

describe("Website Improvement Score", () => {
  const findings = [
    { id: "a", category: "mobile_usability" as const, findingType: "missing_or_invalid_viewport", verificationStatus: "verified", explanation: "", evidence: {}, affectedUrl: "https://example.com", severity: "medium" as const, confidence: "high" as const, suggestedImprovement: "" },
    { id: "b", category: "technical_seo" as const, findingType: "missing_page_title", verificationStatus: "rejected", explanation: "", evidence: {}, affectedUrl: "https://example.com", severity: "medium" as const, confidence: "high" as const, suggestedImprovement: "" },
  ];
  it("is reproducible, traceable, and excludes rejected reviewed findings", () => {
    expect(calculateWebsiteImprovement(findings)).toEqual(calculateWebsiteImprovement(findings));
    expect(calculateWebsiteImprovement(findings).total).toBe(18);
    expect(calculateWebsiteImprovement(findings, true).total).toBe(12);
    expect(calculateWebsiteImprovement(findings, true).findingIds).toEqual(["a"]);
  });
  it("uses exact band boundaries", () => {
    expect([29, 30, 49, 50, 69, 70, 84, 85].map(scoreBand)).toEqual([
      "low_opportunity", "minor_opportunities", "minor_opportunities", "manual_review",
      "manual_review", "strong_opportunity", "strong_opportunity", "high_priority",
    ]);
  });
});

describe("Audit Confidence", () => {
  it("is independent of opportunity score and reflects coverage", () => {
    const high = calculateAuditConfidence({ analyzersCompleted: 6, analyzersExpected: 6, pagesInspected: 3, pagesConfigured: 3, providerAvailable: true, networkFailures: 0, parsingFailures: 0, conflictingResults: 0, manualReviewed: 4, manualRequired: 4 });
    const medium = calculateAuditConfidence({ analyzersCompleted: 5, analyzersExpected: 6, pagesInspected: 2, pagesConfigured: 3, providerAvailable: false, networkFailures: 0, parsingFailures: 0, conflictingResults: 0, manualReviewed: 0, manualRequired: 4 });
    const low = calculateAuditConfidence({ analyzersCompleted: 2, analyzersExpected: 6, pagesInspected: 0, pagesConfigured: 3, providerAvailable: false, networkFailures: 2, parsingFailures: 1, conflictingResults: 0, manualReviewed: 0, manualRequired: 4 });
    expect([high.level, medium.level, low.level]).toEqual(["high", "medium", "low"]);
  });
});
