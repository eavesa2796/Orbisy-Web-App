import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { WorkspaceEditor } from "@/components/admin/workspace-editors";
import { WorkspaceSetupNotice } from "@/components/admin/workspace-status";
import { requireAdmin } from "@/lib/auth";
import {
  getClientWorkspace,
  workspaceSchemaAvailable,
} from "@/lib/data/client-workspaces";
export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  let ready = false,
    unavailable = false;
  try {
    ready = await workspaceSchemaAvailable();
  } catch {
    unavailable = true;
  }
  if (!ready)
    return (
      <AdminShell email={admin.email}>
        <header className="admin-heading">
          <h1>Edit client workspace</h1>
        </header>
        <WorkspaceSetupNotice unavailable={unavailable} />
      </AdminShell>
    );
  const client = await getClientWorkspace(id);
  if (!client) notFound();
  return (
    <AdminShell email={admin.email}>
      <nav className="workspace-breadcrumb" aria-label="Breadcrumb">
        <Link href="/admin-portal/clients">Clients</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/admin-portal/clients/${id}`}>{client.name}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Edit details</span>
      </nav>
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Client workspace</p>
          <h1>Edit {client.name}</h1>
          <p>
            Update contacts, systems, scope, the next action, and agreed
            support. Existing lead records stay intact.
          </p>
        </div>
      </header>
      <section className="admin-card">
        <WorkspaceEditor entry={client} />
      </section>
    </AdminShell>
  );
}
