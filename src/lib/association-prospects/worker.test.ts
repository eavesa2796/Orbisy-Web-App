import { describe, expect, it } from "vitest";
import { associationSearchQuery, chooseLikelyOfficialWebsite, mapEoBmfRow, selectedAssociationWebsite } from "./worker";

describe("association website discovery candidates", () => {
  it("prefers a name-matching organization domain and excludes directory profiles", () => {
    const result = chooseLikelyOfficialWebsite({ name: "Prairie State Builders Association", alternateName: null, city: "Chicago", state: "IL" }, [
      { title: "Prairie State Builders Association", url: "https://prairiestatebuilders.org/", description: "Official website" },
      { title: "Prairie State Builders Association", url: "https://www.facebook.com/prairiestatebuilders", description: "Facebook" },
      { title: "Prairie State Builders Association profile", url: "https://www.chamberofcommerce.com/profile", description: "Business directory" },
    ]);

    expect(result?.url).toBe("https://prairiestatebuilders.org/");
    expect(result?.canScan).toBe(true);
  });

  it("does not call a weak or unrelated search result an official site", () => {
    const result = chooseLikelyOfficialWebsite({ name: "Midwest Professional Builders Alliance", alternateName: null, city: null, state: "IL" }, [
      { title: "Illinois Construction News", url: "https://news.example.org/", description: "Industry headlines" },
      { title: "Midwest Professional Builders Alliance", url: "https://www.linkedin.com/company/example", description: "LinkedIn" },
    ]);

    expect(result).toBeNull();
  });
});

describe("Illinois pilot website matches", () => {
  it("prefers the chamber's own site over the Yahoo listing", () => {
    const result = chooseLikelyOfficialWebsite({ name: "South Loop Chamber of Commerce", alternateName: null, city: "Chicago", state: "IL" }, [
      { title: "Greater Bridgeport & South Loop Chamber of Commerce - Chicago", url: "https://local.yahoo.com/info-123", description: "Business profile" },
      { title: "Greater Bridgeport & South Loop Chamber of Commerce", url: "https://www.southloopchamberofcommerce.com/", description: "Chicago, IL" },
    ]);
    expect(result).toMatchObject({ url: "https://www.southloopchamberofcommerce.com/", canScan: true });
  });

  it.each([
    ["SIGNAL HILL SD 181", "EDWARDSVILLE"],
    ["NORTHERN SUBURBAN SPEC EDUC FAC NSS", "LIBERTYVILLE"],
  ])("keeps a parent site unresolved for %s", (alternateName, city) => {
    const identity = { name: "ILLINOIS EDUCATION ASSOCIATION", alternateName, city, state: "IL" };
    expect(associationSearchQuery(identity)).toBe(`ILLINOIS EDUCATION ASSOCIATION ${alternateName} ${city} IL`);
    const result = chooseLikelyOfficialWebsite(identity, [
      { title: "Illinois Education Association Resources", url: "https://ieanea.org/resources/", description: "Statewide association resources" },
    ]);
    expect(result).toMatchObject({ url: "https://ieanea.org/resources/", canScan: false });
  });

  it("accepts the matching named chapter rather than a different chapter in the filing city", () => {
    const result = chooseLikelyOfficialWebsite({ name: "Association for Corporate Growth", alternateName: "Kansas City", city: "Chicago", state: "IL" }, [
      { title: "Association for Corporate Growth Chicago", url: "https://www.acg.org/chicago", description: "Chicago chapter" },
      { title: "Association for Corporate Growth Kansas City", url: "https://www.acg.org/kc", description: "Kansas City chapter" },
    ]);
    expect(result).toMatchObject({ url: "https://www.acg.org/kc", canScan: true });
  });

  it("uses the nursing association homepage when its acronym and filing city agree", () => {
    const result = chooseLikelyOfficialWebsite({ name: "Organization for Associate Degree Nursing Inc", alternateName: null, city: "Edwardsville", state: "IL" }, [
      { title: "About OADN", url: "https://oadn.org/about/", description: "Edwardsville, IL 62025" },
    ]);
    expect(result).toMatchObject({ url: "https://oadn.org/", canScan: true });
  });

  it("uses the SAMA homepage when the distinctive name agrees with the domain", () => {
    const result = chooseLikelyOfficialWebsite({ name: "Strategic Account Management Association Inc", alternateName: null, city: "Chicago", state: "IL" }, [
      { title: "Home - SAMA - Strategic Account Management Association", url: "https://strategicaccounts.org/", description: "Strategic account management community" },
    ]);
    expect(result).toMatchObject({ url: "https://strategicaccounts.org/", canScan: true });
  });

  it("leaves conflicting domains for a person to resolve", () => {
    const result = chooseLikelyOfficialWebsite({ name: "Prairie State Builders", alternateName: null, city: "Chicago", state: "IL" }, [
      { title: "Prairie State Builders", url: "https://prairiestatebuilders.org/", description: "Chicago" },
      { title: "Prairie State Builders", url: "https://prairiestatebuilders.com/", description: "Chicago" },
    ]);
    expect(result?.canScan).toBe(false);
    expect(result?.reason).toContain("More than one website");
  });

  it("uses explicit selections while rediscovering unreviewed legacy candidates", () => {
    const evidence = [{ kind: "search_review", summary: "Legacy discovery" }];
    const websiteUrl = "https://ieanea.org/resources/";
    expect(selectedAssociationWebsite({ websiteUrl, evidence, reviewStatus: "needs_review" })).toBeNull();
    expect(selectedAssociationWebsite({ websiteUrl, evidence: [], reviewStatus: "needs_review" })).toBe(websiteUrl);
    expect(selectedAssociationWebsite({ websiteUrl, evidence, reviewStatus: "confirmed" })).toBe(websiteUrl);
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
    row[27] = "Sample Local Chapter";

    expect(mapEoBmfRow(row, "IL")).toMatchObject({
      ein: "123456789",
      name: "ILLINOIS SAMPLE ASSOCIATION",
      alternateName: "Sample Local Chapter",
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
