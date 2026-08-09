import { z } from "zod";

const cleanText = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "This field is required.")
    .max(max, `Keep this under ${max} characters.`);

const optionalUrl = z
  .preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.union([
      z.url("Enter a complete URL, including https://").max(500),
      z.literal(""),
      z.undefined(),
    ]),
  )
  .transform((value) => value || undefined);

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

export const recordsRequestSchema = baseSubmissionSchema.extend({
  phone: cleanText(40),
  role: cleanText(100),
  audience: z.enum(["hauler", "restaurant", "general"]),
  serviceArea: cleanText(200),
  locationCount: z.enum(["1–10", "11–50", "51–150", "151–300", "301–1,000", "1,000+", "Not sure"]),
  currentRecordProcess: z.enum(["Mostly paper tickets", "Email and PDF files", "Spreadsheets and shared folders", "Existing field-service software", "Several disconnected systems", "Not sure"]),
  primaryChallenge: cleanText(3000),
  pilotInterest: z.enum(["Ready to discuss a small pilot", "Interested, but need more information", "Researching options for later"]),
});

export const leadSchema = z.object({
  businessName: cleanText(160),
  contactName: z.string().trim().max(100).optional(),
  email: z.union([z.literal(""), z.email()]).optional(),
  websiteUrl: optionalUrl,
  category: z.string().trim().max(120).optional(),
  prospectType: z.enum(["grease_hauler", "restaurant_operator", "facility_team", "other"]),
  serviceTerritory: z.string().trim().max(200).optional(),
  accountCountEstimate: z.string().trim().max(40).optional(),
  currentRecordProcess: z.string().trim().max(160).optional(),
  primaryChallenge: z.string().trim().max(3000).optional(),
  pilotInterest: z.string().trim().max(120).optional(),
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
