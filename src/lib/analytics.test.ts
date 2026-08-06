import { describe, expect, it } from "vitest";
import { analyticsEventSchema } from "@/lib/analytics";

describe("analytics allowlist", () => {
  it("accepts a minimal anonymous event", () => {
    expect(
      analyticsEventSchema.safeParse({
        eventName: "primary_cta_click",
        sessionId: crypto.randomUUID(),
        pagePath: "/",
        componentId: "hero_records_review",
      }).success,
    ).toBe(true);
  });

  it("rejects arbitrary properties and private routes", () => {
    expect(
      analyticsEventSchema.safeParse({
        eventName: "page_view",
        sessionId: crypto.randomUUID(),
        pagePath: "/admin-portal",
        email: "person@example.com",
      }).success,
    ).toBe(false);
  });
});
