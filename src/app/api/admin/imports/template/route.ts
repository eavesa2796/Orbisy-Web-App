import { getAdminIdentity } from "@/lib/auth";

const template = [
  "business_name,industry,address,city,state,postal_code,website_url,public_email,public_phone,contact_name,source_name,source_url,source_identifier,date_discovered",
  "Example Grease Services,Grease hauler,100 Example Ave,Addison,IL,60101,https://example.invalid,operations@example.invalid,224-555-0100,Jordan Lee,Permitted source,https://source.example.invalid,hauler-001,2026-08-08",
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
