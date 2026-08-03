// @vitest-environment node
import { describe, expect, it } from "vitest";
import { canQueueAudit, phaseFiveReadiness, retryDelayMs } from "./policy";

const eligible = {
  eligibilityStatus: "eligible", isAdministratorOverride: false,
  businessFitScore: 80, minimumBusinessFitScore: 65,
  suppressed: false, exactDuplicate: false, existingRelationship: false,
};

describe("deep-audit queue policy", () => {
  it("permits an eligible lead above the score threshold", () => {
    expect(canQueueAudit(eligible)).toEqual({ allowed: true, reason: "eligible" });
  });
  it.each([
    ["suppressed", { suppressed: true }],
    ["exact_duplicate", { exactDuplicate: true }],
    ["existing_relationship", { existingRelationship: true }],
    ["not_eligible", { eligibilityStatus: "ineligible" }],
    ["below_minimum_business_fit", { businessFitScore: 64 }],
  ])("blocks %s", (reason, changes) => {
    expect(canQueueAudit({ ...eligible, ...changes })).toEqual({ allowed: false, reason });
  });
  it("allows an explicit eligible administrator override below the score threshold", () => {
    expect(canQueueAudit({ ...eligible, businessFitScore: 15, isAdministratorOverride: true }).allowed).toBe(true);
  });
  it("uses bounded exponential retry timing", () => {
    expect([1, 2, 3].map((attempt) => retryDelayMs(attempt, 120))).toEqual([120000, 240000, 480000]);
  });
  it("requires every Phase 5 readiness gate", () => {
    const complete = { runCompleted: true, confidence: "medium" as const, minimumConfidence: "medium" as const, unresolvedFindings: 0, suppressionClear: true, blockingError: false, administratorCompletedReview: true };
    expect(phaseFiveReadiness(complete)).toEqual({ ready: true, reasons: [] });
    expect(phaseFiveReadiness({ ...complete, unresolvedFindings: 1, suppressionClear: false })).toEqual({ ready: false, reasons: ["findings_unresolved", "suppressed"] });
  });
});
