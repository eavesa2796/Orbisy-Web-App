import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { DiscoveryEditor } from "@/components/admin/workspace-editors";
import { requireAdmin } from "@/lib/auth";
import { getClientWorkspace } from "@/lib/data/client-workspaces";
export default async function NewBriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const client = await getClientWorkspace(id);
  if (!client) notFound();
  return (
    <AdminShell email={admin.email}>
      <Link
        className="text-link workspace-back"
        href={`/admin-portal/clients/${id}#discovery`}
      >
        ← {client.name}
      </Link>
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Discovery & scope</p>
          <h1>A brief you can review.</h1>
          <p>
            Save an incomplete draft as you learn. Goals, deliverables,
            exclusions, responsibilities, and acceptance criteria are required
            for ready-for-review status.
          </p>
        </div>
      </header>
      <section className="admin-card">
        <DiscoveryEditor workspaceId={id} />
      </section>
    </AdminShell>
  );
}
