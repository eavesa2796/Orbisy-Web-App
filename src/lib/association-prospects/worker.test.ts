import { describe, expect, it } from "vitest";
import { chooseLikelyOfficialWebsite, mapEoBmfRow } from "./worker";

describe("association website discovery candidates", () => {
  it("prefers a name-matching organization domain and excludes directory profiles", () => {
    const result = chooseLikelyOfficialWebsite("Prairie State Builders Association", "IL", [
      { title: "Prairie State Builders Association", url: "https://prairiestatebuilders.org/", description: "Official website" },
      { title: "Prairie State Builders Association", url: "https://www.facebook.com/prairiestatebuilders", description: "Facebook" },
      { title: "Prairie State Builders Association profile", url: "https://www.chamberofcommerce.com/profile", description: "Business directory" },
    ]);

    expect(result?.url).toBe("https://prairiestatebuilders.org/");
    expect(result?.matchScore).toBeGreaterThanOrEqual(0.7);
  });

  it("does not call a weak or unrelated search result an official site", () => {
    const result = chooseLikelyOfficialWebsite("Midwest Professional Builders Alliance", "IL", [
      { title: "Illinois Construction News", url: "https://news.example.org/", description: "Industry headlines" },
      { title: "Midwest Professional Builders Alliance", url: "https://www.linkedin.com/company/example", description: "LinkedIn" },
    ]);

    expect(result).toBeNull();
  });
});

describe("IRS EO BMF sampling fields", () => {
  it("maps the published 28-column CSV fields and keeps only 501(c)(6) rows with selected IRS status codes", () => {
    const row = Array.from({ length: 28 }, () => "");
    row[0] = "123456789";
    row[1] = "ILLINOIS SAMPLE ASSOCIATION";
    row[4] = "Chicago";
    row[5] = "IL";
    row[8] = "06";
    row[10] = "S41";
    row[16] = "01";

    expect(mapEoBmfRow(row, "IL")).toMatchObject({
      ein: "123456789",
      name: "ILLINOIS SAMPLE ASSOCIATION",
      city: "Chicago",
      state: "IL",
      classificationCode: "S41",
      organizationStatusCode: "01",
    });
    row[8] = "03";
    expect(mapEoBmfRow(row, "IL")).toBeNull();
    row[8] = "06";
    row[16] = "25";
    expect(mapEoBmfRow(row, "IL")).toBeNull();
  });
});
