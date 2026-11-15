import Link from "next/link";
import {
  getLeadWorkspace,
  workspaceSchemaAvailable,
} from "@/lib/data/client-workspaces";
export async function LeadWorkspaceLink({ leadId }: { leadId: string }) {
  let available = false,
    workspace: Awaited<ReturnType<typeof getLeadWorkspace>> = null;
  try {
    available = await workspaceSchemaAvailable();
    if (available) workspace = await getLeadWorkspace(leadId);
  } catch {}
  return (
    <section className="notice workspace-lead-link">
      <div>
        <strong>Client workspace</strong>
        <p>
          {workspace
            ? `This record is linked to ${workspace.name}.`
            : available
              ? "Bring this lead, its inquiry, discovery, and client work together."
              : "Client workspaces will be available after the private workspace migration is installed."}
        </p>
      </div>
      {available && (
        <Link
          className="button button-secondary"
          href={
            workspace
              ? `/admin-portal/clients/${workspace.id}`
              : `/admin-portal/clients/new?lead=${leadId}`
          }
        >
          {workspace ? "Open workspace" : "Create / open workspace"}
        </Link>
      )}
    </section>
  );
}
