import { describe, expect, it } from "vitest";
import { parseAssociationContactDetails, preferredBusinessContacts, stampManualContacts } from "./manual-contacts";

function form(overrides: Record<string, string>) {
  const result = new FormData();
  for (const [key, value] of Object.entries({ phone: "", phoneSource: "", email: "", emailSource: "", formUrl: "", outreachReason: "", ...overrides })) {
    result.set(key, value);
  }
  return result;
}

describe("saved association contact details", () => {
  const source = "https://association.test/contact";
  it("validates each source, normalizes direct contacts, and stores an optional reason", () => {
    const input = form({ phone: "(312) 555-0100", phoneSource: source, email: "INFO@association.test", emailSource: source, formUrl: source, outreachReason: " Join form sends visitors to a PDF. " });
    expect(parseAssociationContactDetails(input)).toEqual({
      contacts: [
        { type: "phone", value: "+13125550100", sourceUrl: source },
        { type: "email", value: "info@association.test", sourceUrl: source },
        { type: "form", value: source, sourceUrl: source },
      ],
      outreachReason: "Join form sends visitors to a PDF.",
    });
    expect(() => parseAssociationContactDetails(form({ phone: "3125550100" }))).toThrow("public source URL");
    expect(() => parseAssociationContactDetails(form({ formUrl: "https://user:pass@association.test/" }))).toThrow("contact form URL");
    expect(parseAssociationContactDetails(form({}))).toEqual({ contacts: [], outreachReason: null });
  });

  it("preserves the date of unchanged contacts and gives manual entries priority over new scans", () => {
    const details = [{ type: "phone" as const, value: "+13125550100", sourceUrl: source }];
    const old = stampManualContacts(details, [], new Date("2026-11-25T15:00:00Z"));
    expect(stampManualContacts(details, old, new Date("2026-11-26T15:00:00Z"))).toEqual(old);
    expect(stampManualContacts([{ ...details[0], sourceUrl: "https://association.test/office" }], old, new Date("2026-11-26T15:00:00Z"))[0]?.verifiedAt).toBe("2026-11-26T15:00:00.000Z");
    const email = { type: "email" as const, value: "office@association.test", sourceUrl: source };
    expect(preferredBusinessContacts(old, [{ ...details[0], value: "+13125550123" }, email])).toEqual([...old, email]);
  });
});
