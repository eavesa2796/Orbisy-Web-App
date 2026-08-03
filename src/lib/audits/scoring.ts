import type { FindingDraft } from "./analyzers";

export const WEBSITE_SCORE_VERSION = "website-improvement-v1";
export const CATEGORY_WEIGHTS = { mobile_usability: 20, conversion_path_cta: 20, performance: 15, technical_seo: 15, accessibility: 10, reliability_security: 10, manual_review_opportunity: 10 } as const;
export const FINDING_POINTS: Record<string, number> = {
  missing_or_invalid_viewport: 12, missing_contact_path: 16, missing_page_title: 6,
  missing_meta_description: 3, missing_primary_heading: 6, images_missing_alt: 4,
  form_controls_without_labels: 6, heading_order_warning: 2, duplicate_ids: 3,
  insecure_form_action: 10, pagespeed_mobile_opportunity: 15, obvious_fixed_width: 8,
  missing_document_language: 2, interactive_elements_without_names: 5, page_noindex: 4,
  broken_internal_links: 4, page_http_error: 6,
  administrator_observation: 10,
};

export function scoreBand(score: number) {
  if (score >= 85) return "high_priority" as const; if (score >= 70) return "strong_opportunity" as const;
  if (score >= 50) return "manual_review" as const; if (score >= 30) return "minor_opportunities" as const;
  return "low_opportunity" as const;
}

export function calculateWebsiteImprovement(findings: Array<FindingDraft & { id: string; verificationStatus?: string }>, reviewed = false) {
  const usable = findings.filter((item) => !reviewed || item.verificationStatus !== "rejected");
  const categories = Object.fromEntries(Object.entries(CATEGORY_WEIGHTS).map(([category, maximum]) => {
    const matching = usable.filter((item) => item.category === category);
    const awarded = Math.min(maximum, matching.reduce((sum, item) => sum + (FINDING_POINTS[item.findingType] || 0), 0));
    return [category, { maximum, awarded, findingIds: matching.filter((item) => FINDING_POINTS[item.findingType]).map((item) => item.id) }];
  }));
  const total = Object.values(categories).reduce((sum, item) => sum + item.awarded, 0);
  return { version: WEBSITE_SCORE_VERSION, total, band: scoreBand(total), categories, findingIds: usable.filter((item) => FINDING_POINTS[item.findingType]).map((item) => item.id) };
}
