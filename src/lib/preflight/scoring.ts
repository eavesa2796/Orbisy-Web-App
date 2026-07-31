export const SCORE_VERSION = "business-fit-v1";
export type FitInput = { industryMatch: boolean | null; locationMatch: boolean | null; hasPublicContact: boolean; serviceSuitable: boolean | null; suppressed: boolean; exactDuplicate: boolean; existingDisqualifyingRelationship: boolean };
export function calculateBusinessFit(input: FitInput) {
  const factors = [
    { name: "Target industry", weight: 35, matched: input.industryMatch },
    { name: "Target location", weight: 30, matched: input.locationMatch },
    { name: "Public business contact path", weight: 15, matched: input.hasPublicContact },
    { name: "Suitable for current Orbisy services", weight: 20, matched: input.serviceSuitable },
  ].map((factor) => ({ ...factor, awarded: factor.matched === true ? factor.weight : 0, explanation: factor.matched === null ? "Information unavailable." : factor.matched ? "Objective input matched." : "Objective input did not match." }));
  const gates = [
    input.suppressed && { code: "suppressed", explanation: "Suppression prevents eligibility." },
    input.exactDuplicate && { code: "exact_duplicate", explanation: "An exact duplicate cannot proceed." },
    input.existingDisqualifyingRelationship && { code: "existing_relationship", explanation: "Existing pipeline/contact state prevents a new audit." },
  ].filter(Boolean);
  return { version: SCORE_VERSION, total: factors.reduce((sum, factor) => sum + factor.awarded, 0), factors, gates, inputSnapshot: { ...input } };
}

export type EligibilityInput = { preflightPassed: boolean; safeReachableWebsite: boolean; suppressed: boolean; exactDuplicate: boolean; industryMatch: boolean | null; locationMatch: boolean | null; score: number; minimumScore: number; requireIndustry: boolean; requireLocation: boolean; recentlyChecked: boolean; activeAuditOrJob: boolean };
export function decideAuditEligibility(input: EligibilityInput) {
  const blocked = input.suppressed ? "suppressed" : !input.safeReachableWebsite ? "unsafe_or_unreachable" : null;
  const ineligible = input.exactDuplicate ? "exact_duplicate" : input.activeAuditOrJob ? "existing_job" : input.score < input.minimumScore ? "score_below_threshold" : input.requireIndustry && input.industryMatch === false ? "industry_mismatch" : input.requireLocation && input.locationMatch === false ? "location_mismatch" : null;
  const review = !input.preflightPassed ? "preflight_incomplete" : input.industryMatch === null || input.locationMatch === null ? "incomplete_target_data" : input.recentlyChecked ? "recheck_interval" : null;
  const status: "blocked" | "ineligible" | "needs_manual_review" | "eligible" = blocked ? "blocked" : ineligible ? "ineligible" : review ? "needs_manual_review" : "eligible";
  const reasonCodes = [blocked || ineligible || review || "qualified"];
  return { status, reasonCodes, explanation: status === "eligible" ? "Preflight, target-fit, and score requirements are satisfied. No deep audit was started." : `Audit eligibility is ${status.replaceAll("_", " ")}: ${reasonCodes[0].replaceAll("_", " ")}.` };
}
