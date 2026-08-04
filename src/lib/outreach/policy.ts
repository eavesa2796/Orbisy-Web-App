const unsupportedImpactPatterns = [
  /\$\s?\d[\d,]*(?:\.\d+)?/i,
  /\b\d+(?:\.\d+)?\s*(?:usd|dollars?)\b/i,
  /\b(?:costing|losing|lose|lost)\b[^.!?]{0,80}\b(?:revenue|sales|income|money|customers?)\b/i,
  /\b(?:revenue|sales|income)\s+loss\b/i,
];

export function containsUnsupportedImpactClaim(value: string) {
  return unsupportedImpactPatterns.some((pattern) => pattern.test(value));
}

export function findingDisplayText(finding: {
  administratorExplanation: string | null;
  originalExplanation: string;
}) {
  return finding.administratorExplanation?.trim() || finding.originalExplanation;
}
