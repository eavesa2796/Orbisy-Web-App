import { z } from "zod";
const publicPath = z
  .string()
  .max(200)
  .regex(/^\/(?!admin-portal|api(?:\/|$)|auth(?:\/|$))[a-z0-9\/_-]*$/i);
const label = z
  .string()
  .trim()
  .max(100)
  .regex(/^[a-z0-9 _.,:+\/-]*$/i);
export const attributionSchema = z
  .object({
    landingPath: publicPath,
    submissionPath: publicPath,
    referrerDomain: z
      .string()
      .max(255)
      .regex(/^[a-z0-9.-]+$/i)
      .optional(),
    utmSource: label.optional(),
    utmMedium: label.optional(),
    utmCampaign: label.optional(),
    utmContent: label.optional(),
    utmTerm: label.optional(),
  })
  .strict();
export type InquiryAttribution = z.infer<typeof attributionSchema>;
export const ATTRIBUTION_KEY = "orbisy_inquiry_attribution";
export function sanitizeAttribution(
  url: URL,
  referrer: string,
): InquiryAttribution | undefined {
  let domain: string | undefined;
  try {
    domain = referrer ? new URL(referrer).hostname : undefined;
  } catch {}
  const candidate: Record<string, string> = {
    landingPath: url.pathname,
    submissionPath: url.pathname,
  };
  if (domain && /^[a-z0-9.-]+$/i.test(domain))
    candidate.referrerDomain = domain;
  for (const [field, query] of [
    ["utmSource", "utm_source"],
    ["utmMedium", "utm_medium"],
    ["utmCampaign", "utm_campaign"],
    ["utmContent", "utm_content"],
    ["utmTerm", "utm_term"],
  ]) {
    const value = url.searchParams.get(query)?.trim();
    if (value && label.safeParse(value).success) candidate[field] = value;
  }
  const parsed = attributionSchema.safeParse(candidate);
  return parsed.success ? parsed.data : undefined;
}
