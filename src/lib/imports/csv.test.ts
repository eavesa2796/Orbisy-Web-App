import { describe, expect, it } from "vitest";
import {
  encodeCsvCell,
  normalizeCsvRow,
  parseCsvText,
} from "@/lib/imports/csv";

describe("CSV imports", () => {
  it("parses quoted CSV and normalizes a mapped row", () => {
    const [row] = parseCsvText('Business,Website,City\n"Acme, LLC",acme.test,Chicago');
    const candidate = normalizeCsvRow(
      row,
      { businessName: "Business", websiteUrl: "Website", city: "City" },
      2,
      "Permitted source",
    );
    expect(candidate.businessName).toBe("Acme, LLC");
    expect(candidate.normalizedDomain).toBe("acme.test");
    expect(candidate.validationErrors).toEqual([]);
  });

  it("escapes formula-like exports", () => {
    expect(encodeCsvCell("=HYPERLINK(\"bad\")")).toBe(
      '"\'=HYPERLINK(""bad"")"',
    );
  });

  it("rejects malformed and excessive input", () => {
    expect(() => parseCsvText("name\none\ntwo", 1)).toThrow(
      "exceeds the 1-row limit",
    );
    expect(() => parseCsvText('name\n"unterminated')).toThrow();
    expect(() => parseCsvText("name\nbad\u0000value")).toThrow(
      "unsupported null bytes",
    );
  });
});
