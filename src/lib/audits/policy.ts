export const AUDIT_VERSION = "deep-audit-v1";
export const AUDIT_WORKER_LEASE_SECONDS = 300;

export const EXISTING_RELATIONSHIP_STATUSES = new Set([
  "contacted", "replied", "consultation", "proposal_sent", "won",
]);

export function canQueueAudit(input: {
  eligibilityStatus: string;
  isAdministratorOverride: boolean;
  businessFitScore: number | null;
  minimumBusinessFitScore: number;
  suppressed: boolean;
  exactDuplicate: boolean;
  existingRelationship: boolean;
}) {
  if (input.suppressed) return { allowed: false, reason: "suppressed" } as const;
  if (input.exactDuplicate) return { allowed: false, reason: "exact_duplicate" } as const;
  if (input.existingRelationship) return { allowed: false, reason: "existing_relationship" } as const;
  if (input.eligibilityStatus !== "eligible") return { allowed: false, reason: "not_eligible" } as const;
  if (!input.isAdministratorOverride && (input.businessFitScore ?? -1) < input.minimumBusinessFitScore) {
    return { allowed: false, reason: "below_minimum_business_fit" } as const;
  }
  return { allowed: true, reason: "eligible" } as const;
}

export function retryDelayMs(attemptCount: number, backoffSeconds: number) {
  return backoffSeconds * 1000 * 2 ** Math.max(0, attemptCount - 1);
}

const confidenceRank = { low: 0, medium: 1, high: 2 } as const;
export function phaseFiveReadiness(input: {
  runCompleted: boolean; confidence: "low" | "medium" | "high";
  minimumConfidence: "low" | "medium" | "high"; unresolvedFindings: number;
  suppressionClear: boolean; blockingError: boolean; administratorCompletedReview: boolean;
}) {
  const reasons: string[] = [];
  if (!input.runCompleted) reasons.push("run_incomplete");
  if (confidenceRank[input.confidence] < confidenceRank[input.minimumConfidence]) reasons.push("confidence_below_requirement");
  if (input.unresolvedFindings) reasons.push("findings_unresolved");
  if (!input.suppressionClear) reasons.push("suppressed");
  if (input.blockingError) reasons.push("blocking_error");
  if (!input.administratorCompletedReview) reasons.push("review_incomplete");
  return { ready: reasons.length === 0, reasons };
}
