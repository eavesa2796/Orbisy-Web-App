import { getAdminIdentity } from "@/lib/auth";
import { getDiscoveryBrief } from "@/lib/data/client-workspaces";
import { briefMarkdown, recordIdSchema } from "@/lib/client-workspaces";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminIdentity()))
    return new Response("Administrator access required.", {
      status: 403,
      headers: { "Cache-Control": "private, no-store" },
    });
  const { id } = await params;
  if (!recordIdSchema.safeParse(id).success)
    return new Response("Not found", { status: 404 });
  const data = await getDiscoveryBrief(id);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(briefMarkdown(data.workspace.name, data.brief), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="orbisy-discovery-${id}.md"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
