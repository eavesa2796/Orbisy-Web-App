import { describe, expect, it } from "vitest";
import { homepageReviewSchema, projectRequestSchema } from "@/lib/validation";

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

  it("accepts a project request with optional fields left blank", () => {
    const result = projectRequestSchema.safeParse({
      ...base,
      websiteUrl: "",
      serviceNeeded: "Website design or redesign",
      projectDescription: "A focused website refresh.",
      timeline: "",
      budgetRange: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.budgetRange).toBeUndefined();
    }
  });

  it("accepts the Phase 1 managed-records project request", () => {
    const result = projectRequestSchema.safeParse({
      ...base,
      serviceNeeded: "Restaurant records cleanup pilot",
      projectDescription:
        "Records are split between email and location folders.",
      timeline: "Within 30 days",
      budgetRange: "Not sure yet",
    });
    expect(result.success).toBe(true);
  });
});


describe("Platform details in association inquiries", () => {
 const input = {...base, serviceNeeded: "Integrations & connected systems", projectDescription: "Avoid re-entering registrations."};
 it("normalizes platform details into the saved description without a database change", () => {
 const result = projectRequestSchema.parse({...input, currentPlatforms: "  MemberClicks, Whova  "});
 expect(result.projectDescription).toBe("Current platforms: MemberClicks, Whova\n\nAvoid re-entering registrations.");
 expect(projectRequestSchema.parse(input).projectDescription).toBe(input.projectDescription);
 });
 it("enforces both platform and combined saved-description limits", () => {
 expect(projectRequestSchema.safeParse({...input,currentPlatforms:"x".repeat(241)}).success).toBe(false);
 expect(projectRequestSchema.safeParse({...input,currentPlatforms:"Whova",projectDescription:"x".repeat(2990)}).success).toBe(false);
 expect(projectRequestSchema.safeParse({...input,currentPlatforms:"Whova",projectDescription:"x".repeat(2900)}).success).toBe(true);
 });
});
