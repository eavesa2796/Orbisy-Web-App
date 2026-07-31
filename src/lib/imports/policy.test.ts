import { describe, expect, it } from "vitest";
import {
  canConfirmBatch,
  isAdminEmailAllowed,
  matchesSuppression,
} from "@/lib/imports/policy";

describe("Phase Two security policies", () => {
  it("allows only the configured administrator email", () => {
    expect(
      isAdminEmailAllowed(" AnthonyEaves33@gmail.com ", "anthonyeaves33@gmail.com"),
    ).toBe(true);
    expect(isAdminEmailAllowed("other@example.com", "admin@example.com")).toBe(
      false,
    );
  });

  it("makes import confirmation idempotent", () => {
    expect(canConfirmBatch({ confirmedAt: null, status: "ready" })).toBe(true);
    expect(
      canConfirmBatch({ confirmedAt: new Date(), status: "completed" }),
    ).toBe(false);
    expect(canConfirmBatch({ confirmedAt: null, status: "importing" })).toBe(
      false,
    );
  });

  it("matches suppression values deterministically", () => {
    expect(
      matchesSuppression(
        { normalizedDomain: "example.com" },
        { normalizedDomain: "example.com" },
      ),
    ).toBe(true);
    expect(
      matchesSuppression(
        { normalizedEmail: "public@example.com" },
        { normalizedDomain: "example.com" },
      ),
    ).toBe(false);
  });
});
