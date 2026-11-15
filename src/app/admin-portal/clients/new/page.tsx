import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { WorkspaceEditor } from "@/components/admin/workspace-editors";
import { WorkspaceSetupNotice } from "@/components/admin/workspace-status";
import { requireAdmin } from "@/lib/auth";
import {
  getLeadForWorkspace,
  getLeadWorkspace,
  workspaceSchemaAvailable,
} from "@/lib/data/client-workspaces";
export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string }>;
}) {
  const admin = await requireAdmin();
  const { lead: leadId } = await searchParams;
  let ready = false,
    unavailable = false;
  try {
    ready = await workspaceSchemaAvailable();
  } catch {
    unavailable = true;
  }
  const linked = ready && leadId ? await getLeadWorkspace(leadId) : null;
  if (linked) redirect(`/admin-portal/clients/${linked.id}`);
  const lead = ready && leadId ? await getLeadForWorkspace(leadId) : null;
  return (
    <AdminShell email={admin.email}>
      <Link className="text-link workspace-back" href="/admin-portal/clients">
        ← Clients & organizations
      </Link>
      <header className="admin-heading">
        <div>
          <p className="eyebrow">New workspace</p>
          <h1>A home for the client work.</h1>
          <p>
            Create a prospect or client record. No existing lead is moved or
            changed.
          </p>
        </div>
      </header>
      {!ready ? (
        <WorkspaceSetupNotice unavailable={unavailable} />
      ) : (
        <>
          {lead && (
            <p className="notice">
              Linking the existing record for {lead.businessName}. Its inquiry,
              notes, and pipeline history stay intact.
            </p>
          )}
          {leadId && !lead && (
            <p className="notice warning-notice">
              The requested lead was not found. You can still create a
              standalone workspace.
            </p>
          )}
          <section className="admin-card">
            <WorkspaceEditor
              sourceLeadId={lead?.id}
              initial={
                lead
                  ? {
                      name: lead.businessName,
                      contactName: lead.contactName ?? "",
                      contactEmail: lead.email ?? "",
                      websiteUrl: lead.websiteUrl ?? "",
                    }
                  : undefined
              }
            />
          </section>
        </>
      )}
    </AdminShell>
  );
}
