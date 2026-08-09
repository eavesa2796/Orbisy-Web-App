import { describe, expect, it } from "vitest";
import { recordsRequestSchema } from "@/lib/validation";

const base = {
  name: "Anthony",
  businessName: "Orbisy",
  email: "info@orbisy.com",
  websiteUrl: "https://orbisy.com",
  consent: "on",
  company: "",
  phone: "224-323-6231",
  role: "Owner",
  serviceArea: "DuPage County, Illinois",
  locationCount: "151–300",
  currentRecordProcess: "Email and PDF files",
  primaryChallenge: "Customers frequently request old tickets.",
  pilotInterest: "Ready to discuss a small pilot",
};

describe("public form validation", () => {
  it("accepts a valid hauler workflow request", () => {
    const result = recordsRequestSchema.safeParse({ ...base, audience: "hauler" });
    expect(result.success).toBe(true);
  });

  it("accepts a records request without a website URL", () => {
    const withoutWebsite: Partial<typeof base> = { ...base };
    delete withoutWebsite.websiteUrl;
    const result = recordsRequestSchema.safeParse({ ...withoutWebsite, audience: "hauler" });
    expect(result.success).toBe(true);
  });

  it("rejects missing consent and invalid URLs", () => {
    const result = recordsRequestSchema.safeParse({
      ...base,
      websiteUrl: "orbisy",
      consent: undefined,
      audience: "hauler",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unexpected account ranges", () => {
    const result = recordsRequestSchema.safeParse({ ...base, audience: "hauler", locationCount: "Millions" });
    expect(result.success).toBe(false);
  });

  it("accepts a restaurant records request", () => {
    const result = recordsRequestSchema.safeParse({ ...base, audience: "restaurant", locationCount: "11–50" });
    expect(result.success).toBe(true);
  });
});
