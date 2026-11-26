import { z } from "zod";
import { normalizeEmail, normalizePhone, type PublicBusinessContact } from "./contacts";

export type ManualAssociationContact = {
  type: PublicBusinessContact["type"] | "form";
  value: string;
  sourceUrl: string;
  verifiedAt: string;
};

function publicLink(value: string) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

const editor = z.object({
  phone: z.string().trim().max(40),
  phoneSource: z.string().trim().max(2000),
  email: z.string().trim().max(254),
  emailSource: z.string().trim().max(2000),
  formUrl: z.string().trim().max(2000),
  outreachReason: z.string().trim().max(1000),
});

export function parseAssociationContactDetails(form: FormData) {
  const fields = editor.parse(Object.fromEntries(form));
  const channels = [
    { type: "phone" as const, raw: fields.phone, value: normalizePhone(fields.phone), source: fields.phoneSource },
    { type: "email" as const, raw: fields.email, value: normalizeEmail(fields.email), source: fields.emailSource },
    { type: "form" as const, raw: fields.formUrl, value: publicLink(fields.formUrl), source: fields.formUrl },
  ];
  const contacts: Omit<ManualAssociationContact, "verifiedAt">[] = [];
  for (const { type, raw, value, source } of channels) {
    if (!raw && !source) continue;
    const sourceUrl = publicLink(source);
    if (!value || !sourceUrl) throw new Error(`Enter a valid ${type === "form" ? "contact form URL" : `${type} and public source URL`}.`);
    contacts.push({ type, value, sourceUrl });
  }
  return { contacts, outreachReason: fields.outreachReason || null };
}

export function stampManualContacts(
  contacts: Omit<ManualAssociationContact, "verifiedAt">[],
  previous: ManualAssociationContact[],
  now: Date,
) {
  return contacts.map((contact) => {
    const prior = previous.find((item) => item.type === contact.type && item.value === contact.value && item.sourceUrl === contact.sourceUrl);
    return { ...contact, verifiedAt: prior?.verifiedAt || now.toISOString() };
  });
}

export function preferredBusinessContacts(manual: ManualAssociationContact[], scanned: PublicBusinessContact[]) {
  return [
    ...manual,
    ...scanned.filter((item) => !manual.some((contact) => contact.type === item.type)),
  ];
}
