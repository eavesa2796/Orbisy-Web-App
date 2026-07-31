import { getAdminIdentity } from "@/lib/auth";

const template = [
  "business_name,industry,address,city,state,postal_code,website_url,public_email,public_phone,contact_name,source_name,source_url,source_identifier,date_discovered",
  "Example Construction LLC,Construction,100 Example Ave,Chicago,IL,60601,https://example.invalid,info@example.invalid,312-555-0100,,Permitted source,https://source.example.invalid,example-001,2026-07-30",
].join("\r\n");

export async function GET() {
  if (!(await getAdminIdentity())) {
    return new Response("Unauthorized", { status: 401 });
  }
  return new Response(template, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="orbisy-import-template.csv"',
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
