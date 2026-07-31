import { describe, expect, it } from "vitest";
import {
  normalizeBusinessName,
  normalizeEmail,
  normalizePhone,
  normalizeWebsite,
} from "@/lib/imports/normalization";

describe("import normalization", () => {
  it("normalizes comparison values without changing original evidence", () => {
    expect(normalizeBusinessName("  Acme Builders, LLC ")).toBe("acme builders");
    expect(normalizeEmail(" SALES@Example.COM ")).toBe("sales@example.com");
    expect(normalizePhone("(312) 555-0100")).toBe("+13125550100");
  });

  it("normalizes websites and www variants", () => {
    expect(normalizeWebsite("www.Example.com/").normalizedDomain).toBe(
      "example.com",
    );
    expect(normalizeWebsite("javascript:alert(1)").valid).toBe(false);
  });
});
