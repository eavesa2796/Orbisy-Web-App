export const AUDIT_CONFIDENCE_VERSION = "audit-confidence-v1";

export function calculateAuditConfidence(input: {
  analyzersCompleted: number; analyzersExpected: number; pagesInspected: number;
  pagesConfigured: number; providerAvailable: boolean; networkFailures: number;
  parsingFailures: number; conflictingResults: number; manualReviewed: number; manualRequired: number;
}) {
  const analyzerCoverage = input.analyzersExpected ? input.analyzersCompleted / input.analyzersExpected : 0;
  const pageCoverage = input.pagesConfigured ? Math.min(1, input.pagesInspected / input.pagesConfigured) : 0;
  const reviewCoverage = input.manualRequired ? input.manualReviewed / input.manualRequired : 0;
  let points = analyzerCoverage * 45 + pageCoverage * 30 + (input.providerAvailable ? 10 : 0) + reviewCoverage * 15;
  points -= input.networkFailures * 12 + input.parsingFailures * 8 + input.conflictingResults * 5;
  points = Math.max(0, Math.min(100, Math.round(points)));
  const level = points >= 75 ? "high" : points >= 45 ? "medium" : "low";
  return { version: AUDIT_CONFIDENCE_VERSION, level, points, factors: { analyzerCoverage: Math.round(analyzerCoverage * 100), pageCoverage: Math.round(pageCoverage * 100), providerAvailable: input.providerAvailable, networkFailures: input.networkFailures, parsingFailures: input.parsingFailures, conflictingResults: input.conflictingResults, manualReviewCoverage: Math.round(reviewCoverage * 100) }, explanation: `Audit confidence is ${level} (${points}/100) based on completed analyzers, inspected pages, provider availability, failures, conflicts, and manual-review coverage.` } as const;
}
