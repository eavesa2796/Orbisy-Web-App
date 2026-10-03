import { z } from "zod";
export const pricingCategories = {
  website: "Website design & development",
  google_ads: "Google Ads",
  local_seo: "Local SEO",
  development: "Development, integrations & automation",
  maintenance: "Maintenance & support",
  add_on: "Add-ons",
  package: "Packages",
} as const;
export const billingLabels = {
  one_time: "One-time project",
  monthly: "Monthly",
  hourly: "Hourly",
  per_unit: "Per unit / deliverable",
  custom: "Custom scope",
} as const;
const money = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || /^\d{1,7}(?:\.\d{1,2})?$/.test(v),
    "Use a nonnegative amount with at most two decimal places, or leave blank.",
  )
  .transform((v) => (v === "" ? null : Math.round(Number(v) * 100)));
export const pricingSchema = z
  .object({
    id: z.union([z.literal(""), z.uuid()]),
    name: z.string().trim().min(1, "A name is required.").max(160),
    category: z.enum([
      "website",
      "google_ads",
      "local_seo",
      "development",
      "maintenance",
      "add_on",
      "package",
    ]),
    description: z.string().trim().max(3000),
    deliverables: z
      .string()
      .trim()
      .max(6000)
      .transform((v) =>
        v
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      )
      .refine(
        (v) => v.length <= 30 && v.every((line) => line.length <= 300),
        "Use up to 30 deliverables of 300 characters each.",
      ),
    billingBasis: z.enum([
      "one_time",
      "monthly",
      "hourly",
      "per_unit",
      "custom",
    ]),
    amount: money,
    setupFee: money,
    recurringFee: money,
    recurringInterval: z.string().trim().max(80),
    internalNotes: z.string().trim().max(6000),
    status: z.enum(["draft", "active", "archived"]),
  })
  .refine((v) => v.recurringFee === null || v.recurringInterval.length > 0, {
    path: ["recurringInterval"],
    message: "Specify an interval when a recurring fee is set.",
  });
export const formatMoney = (cents: number | null) =>
  cents === null
    ? "Unset"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(cents / 100);
export const moneyInput = (cents: number | null) =>
  cents === null ? "" : (cents / 100).toFixed(2);
