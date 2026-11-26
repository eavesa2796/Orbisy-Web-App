import { preferredBusinessContacts } from "@/lib/association-prospects/manual-contacts";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { associationProspects } from "@/lib/db/schema";

function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  await requireAdmin();
  const rows = await getDb().select().from(associationProspects).orderBy(desc(associationProspects.updatedAt)).limit(50_000);
  const header = ["name", "alternate_name", "ein", "city", "state", "subsection_code", "classification_code", "organization_status_code", "website_url", "website_condition", "review_status", "public_phone", "public_email", "public_contacts", "evidence", "source_name", "source_url", "source_checked_at", "last_checked_at", "review_note", "public_contact_form", "manual_contacts", "why_contact_them"];
  const body = rows.map((row) => {
    const contacts = preferredBusinessContacts(row.manualContacts, row.publicContacts);
    const valuesFor = (type: "phone" | "email") => contacts.filter((item) => item.type === type).map((item) => item.value).join("; ");
    return [
      row.name, row.alternateName, row.ein, row.city, row.state, row.subsectionCode,
      row.classificationCode, row.organizationStatusCode, row.websiteUrl,
      row.websiteCondition, row.reviewStatus, valuesFor("phone"), valuesFor("email"),
      JSON.stringify(row.publicContacts), JSON.stringify(row.evidence), row.sourceName,
      row.sourceUrl, row.sourceCheckedAt?.toISOString(), row.lastCheckedAt?.toISOString(),
      row.reviewNote, row.manualContacts.find((contact) => contact.type === "form")?.value,
      JSON.stringify(row.manualContacts), row.outreachReason,
    ].map(csvCell).join(",");
  });
  return new Response([header.map(csvCell).join(","), ...body].join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="orbisy-association-prospects.csv"',
      "cache-control": "private, no-store",
    },
  });
}
