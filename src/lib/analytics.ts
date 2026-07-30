import { z } from "zod";

export const analyticsEventNames = [
  "page_view",
  "primary_cta_click",
  "secondary_cta_click",
  "service_view",
  "portfolio_concept_view",
  "faq_expand",
  "contact_link_click",
  "scroll_25",
  "scroll_50",
  "scroll_75",
  "scroll_90",
  "homepage_review_form_view",
  "homepage_review_form_start",
  "homepage_review_form_validation_error",
  "homepage_review_form_submit_success",
  "project_request_form_view",
  "project_request_form_start",
  "project_request_form_validation_error",
  "project_request_form_submit_success",
] as const;

export const analyticsEventSchema = z
  .object({
    eventName: z.enum(analyticsEventNames),
    sessionId: z.string().uuid(),
    pagePath: z
      .string()
      .max(300)
      .regex(/^\/(?!admin-portal|api|auth)/),
    referrerDomain: z.string().max(255).optional(),
    utmSource: z.string().max(100).optional(),
    utmMedium: z.string().max(100).optional(),
    utmCampaign: z.string().max(100).optional(),
    deviceCategory: z.enum(["mobile", "tablet", "desktop"]).optional(),
    viewportCategory: z.enum(["small", "medium", "large"]).optional(),
    componentId: z
      .enum([
        "hero_primary",
        "hero_secondary",
        "nav_review",
        "footer_email",
        "service_websites",
        "service_refresh",
        "service_tools",
        "service_automation",
        "concept_construction",
        "concept_insurance",
        "concept_agency",
      ])
      .optional(),
  })
  .strict();
