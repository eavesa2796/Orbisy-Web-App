import { z } from "zod";
export const pricingCategories = {
  website: "Website design & development",
  google_ads: "Google Ads (legacy)",
  local_seo: "Local SEO (legacy)",
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
    rangeMin: money.prefault(""),
    rangeMax: money.prefault(""),
    setupFee: money,
    recurringFee: money,
    recurringInterval: z.string().trim().max(80),
    internalNotes: z.string().trim().max(6000),
    status: z.enum(["draft", "active", "archived"]),
  })
  .refine((v) => (v.rangeMin === null && v.rangeMax === null) || (v.rangeMin !== null && v.rangeMax !== null && v.rangeMax >= v.rangeMin), {path: ["rangeMax"], message: "Enter both range amounts with the maximum at least the minimum."})
  .refine((v) => v.amount === null || (v.rangeMin === null && v.rangeMax === null), {path: ["amount"], message: "Use a fixed base amount or a range, not both."})
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
export function formatPricingAmount(entry: {amountCents: number|null; rangeMinCents: number|null; rangeMaxCents: number|null}) {
  return entry.rangeMinCents !== null && entry.rangeMaxCents !== null ? `${formatMoney(entry.rangeMinCents)}–${formatMoney(entry.rangeMaxCents)}` : formatMoney(entry.amountCents);
}
export const legacyPricingTemplateKeys = ["website-project", "ads-setup", "ads-management", "seo-setup", "seo-recurring", "custom-project", "integration", "automation", "maintenance", "support", "landing-page", "extra-page", "copywriting", "tracking", "local-launch"];
export function isLegacyPricing(entry: {templateKey: string|null; category: string}) {
  return entry.category === "google_ads" || entry.category === "local_seo" || (entry.templateKey !== null && legacyPricingTemplateKeys.includes(entry.templateKey));
}
