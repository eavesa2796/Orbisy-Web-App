import { z } from "zod";

const cleanText = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "This field is required.")
    .max(max, `Keep this under ${max} characters.`);

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .transform((value) => value || undefined)
  .pipe(z.url("Enter a complete URL, including https://").optional());

const baseSubmissionSchema = z.object({
  name: cleanText(100),
  businessName: cleanText(160),
  email: z.email("Enter a valid email address.").max(254),
  websiteUrl: optionalUrl,
  consent: z.literal("on", {
    error: "Please acknowledge the Privacy Policy.",
  }),
  company: z.string().max(0, "Spam protection failed.").optional(),
  submissionToken: z.string().uuid().optional(),
  turnstileToken: z.string().max(2048).optional(),
});

export const homepageReviewSchema = baseSubmissionSchema.extend({
  primaryGoal: cleanText(200),
  websiteConcern: cleanText(1500),
});

export const projectRequestSchema = baseSubmissionSchema.extend({
  serviceNeeded: cleanText(120),
  projectDescription: cleanText(3000),
  timeline: z.string().trim().max(80).optional(),
  budgetRange: z
    .enum([
      "Under $1,500",
      "$1,500–$3,000",
      "$3,000–$5,000",
      "$5,000–$10,000",
      "$10,000+",
      "Not sure yet",
    ])
    .optional(),
});

export const leadSchema = z.object({
  businessName: cleanText(160),
  contactName: z.string().trim().max(100).optional(),
  email: z.union([z.literal(""), z.email()]).optional(),
  websiteUrl: optionalUrl,
  category: z.string().trim().max(120).optional(),
  industry: z.string().trim().max(120).optional(),
  address: z.string().trim().max(255).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(80).optional(),
  postalCode: z.string().trim().max(20).optional(),
  phone: z.string().trim().max(40).optional(),
  location: z.string().trim().max(160).optional(),
  sourceName: cleanText(120),
  sourceUrl: optionalUrl,
  sourceIdentifier: z.string().trim().max(255).optional(),
});

export const leadStatusValues = [
  "new_inbound",
  "manually_added",
  "needs_review",
  "qualified",
  "contact_planned",
  "contacted",
  "replied",
  "consultation",
  "proposal_sent",
  "won",
  "lost",
  "suppressed",
] as const;

export const updateLeadSchema = z.object({
  status: z.enum(leadStatusValues),
  followUpAt: z.string().trim().max(40).optional(),
  note: z.string().trim().max(3000).optional(),
});
