import { describe, expect, it } from "vitest";
import {
  calendarDate,
  todayInChicago,
  workspaceSchema,
} from "@/lib/client-workspaces";
describe("Workspace boundaries", () => {
  it("uses the Chicago calendar day across UTC midnight and daylight-saving boundaries", () => {
    expect(todayInChicago(new Date("2026-11-15T02:00:00Z"))).toBe("2026-11-14");
    expect(todayInChicago(new Date("2026-07-01T04:00:00Z"))).toBe("2026-06-30");
  });
  it("rejects impossible calendar dates", () => {
    for (const value of ["2026-02-30", "2026-13-01", "2026-1-1", "abc"])
      expect(calendarDate.safeParse(value).success).toBe(false);
    expect(calendarDate.safeParse("2028-02-29").success).toBe(true);
    expect(calendarDate.safeParse("").success).toBe(true);
  });
  it("requires credential-free http URLs in workspace references", () => {
    const base = {
      id: crypto.randomUUID(),
      version: 1,
      mode: "create",
      sourceLeadId: "",
      name: "Example",
      status: "prospect",
      contactName: "",
      contactEmail: "",
      contactRole: "",
      websiteUrl: "",
      cms: "",
      platforms: "",
      vendorContacts: "",
      accessNotes: "",
      currentScope: "",
      supportScope: "",
      supportCapacity: "",
      supportBoundaries: "",
      nextAction: "",
      nextActionDate: "",
      proposalStatus: "not_started",
      proposalUrl: "",
    };
    for (const value of [
      "javascript:alert(1)",
      "https://user:password@example.test",
      "file:///etc/passwd",
    ])
      expect(
        workspaceSchema.safeParse({ ...base, proposalUrl: value }).success,
      ).toBe(false);
    expect(
      workspaceSchema.safeParse({
        ...base,
        proposalUrl: "https://example.test/proposal",
      }).success,
    ).toBe(true);
    expect(
      workspaceSchema.safeParse({ ...base, nextActionDate: "2026-11-15" })
        .success,
    ).toBe(false);
  });
});
