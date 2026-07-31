import { z } from "zod";
import { getAdminIdentity } from "@/lib/auth";
import { rejectedRowsCsv } from "@/lib/imports/service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminIdentity())) {
    return new Response("Unauthorized", { status: 401 });
  }
  const id = z.string().uuid().parse((await context.params).id);
  const csv = await rejectedRowsCsv(id);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orbisy-import-${id}-rejected.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
