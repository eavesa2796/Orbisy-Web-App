import { describe, expect, it } from "vitest";
import {
  homepageReviewSchema,
  projectRequestSchema,
} from "@/lib/validation";

const base = {
  name: "Anthony",
  businessName: "Orbisy",
  email: "info@orbisy.com",
  websiteUrl: "https://orbisy.com",
  consent: "on",
  company: "",
};

describe("public form validation", () => {
  it("accepts a valid homepage review", () => {
    const result = homepageReviewSchema.safeParse({
      ...base,
      primaryGoal: "Generate qualified inquiries",
      websiteConcern: "The contact path is unclear.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing consent and invalid URLs", () => {
    const result = homepageReviewSchema.safeParse({
      ...base,
      websiteUrl: "orbisy",
      consent: undefined,
      primaryGoal: "Grow",
      websiteConcern: "Unclear",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unexpected budget values", () => {
    const result = projectRequestSchema.safeParse({
      ...base,
      serviceNeeded: "Website refresh",
      projectDescription: "A focused website refresh.",
      budgetRange: "Unlimited",
    });
    expect(result.success).toBe(false);
  });

  it("accepts the Phase 1 managed-records project request", () => {
    const result = projectRequestSchema.safeParse({
      ...base,
      serviceNeeded: "Restaurant records cleanup pilot",
      projectDescription: "Records are split between email and location folders.",
      timeline: "Within 30 days",
      budgetRange: "Not sure yet",
    });
    expect(result.success).toBe(true);
  });
});
