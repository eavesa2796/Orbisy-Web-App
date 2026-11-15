import Link from "next/link";
import { UsersRound, ArrowUpRight, Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { WorkspaceSetupNotice } from "@/components/admin/workspace-status";
import { requireAdmin } from "@/lib/auth";
import {
  getClientWorkspaces,
  workspaceSchemaAvailable,
} from "@/lib/data/client-workspaces";
import {
  displayDate,
  workspaceStatuses,
  proposalStatuses,
} from "@/lib/client-workspaces";
export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const status = Object.hasOwn(workspaceStatuses, params.status ?? "")
    ? params.status!
    : "";
  let ready = false,
    unavailable = false,
    data: Awaited<ReturnType<typeof getClientWorkspaces>> | null = null;
  try {
    ready = await workspaceSchemaAvailable();
    if (ready)
      data = await getClientWorkspaces({
        query: params.q,
        status,
        page: Number(params.page ?? 1),
      });
  } catch {
    unavailable = true;
  }
  const pageHref = (page: number) =>
    `/admin-portal/clients?${new URLSearchParams({ q: params.q ?? "", status, page: String(page) })}`;
  return (
    <AdminShell email={admin.email}>
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Agency workspace</p>
          <h1>Clients & organizations</h1>
          <p>Keep the people, systems, and next steps in one place.</p>
        </div>
        {ready && (
          <Link className="button" href="/admin-portal/clients/new">
            <Plus size={17} aria-hidden="true" />
            New workspace
          </Link>
        )}
      </header>
      {!data ? (
        <WorkspaceSetupNotice unavailable={unavailable} />
      ) : (
        <>
          <form className="workspace-filter" method="get">
            <label>
              Search clients
              <input
                name="q"
                maxLength={120}
                defaultValue={params.q}
                placeholder="Organization or contact email"
              />
            </label>
            <label>
              Status
              <select name="status" defaultValue={status}>
                <option value="">All except archived</option>
                {Object.entries(workspaceStatuses).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button className="button button-secondary">Filter</button>
          </form>
          <p className="workspace-results">
            {data.total} matching{" "}
            {data.total === 1 ? "workspace" : "workspaces"} · Page {data.page}
          </p>
          {data.items.length ? (
            <div className="client-workspace-grid">
              {data.items.map((client) => (
                <Link
                  className="client-workspace-card"
                  href={`/admin-portal/clients/${client.id}`}
                  key={client.id}
                >
                  <div className="workspace-card-top">
                    <span className="workspace-avatar">
                      <UsersRound size={22} aria-hidden="true" />
                    </span>
                    <span className={`workspace-badge status-${client.status}`}>
                      {
                        workspaceStatuses[
                          client.status as keyof typeof workspaceStatuses
                        ]
                      }
                    </span>
                  </div>
                  <h2>
                    {client.name}
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </h2>
                  <p>
                    {client.contactName || "Contact not recorded"}
                    {client.cms ? ` · ${client.cms}` : ""}
                  </p>
                  <div className="workspace-card-next">
                    <span>Next action</span>
                    <strong>{client.nextAction || "Set a next step"}</strong>
                    <small>{displayDate(client.nextActionDate)}</small>
                  </div>
                  <span className="field-help">
                    Proposal:{" "}
                    {
                      proposalStatuses[
                        client.proposalStatus as keyof typeof proposalStatuses
                      ]
                    }
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <section className="admin-card empty-state">
              <h2>
                {data.total
                  ? "No workspaces on this page"
                  : "Start with one client workspace"}
              </h2>
              <p>
                Create a workspace directly, or open an existing lead and link
                its inquiry.
              </p>
              <Link className="text-link" href="/admin-portal/clients/new">
                Create a workspace →
              </Link>
            </section>
          )}
          <nav className="workspace-pagination" aria-label="Client pages">
            {data.page > 1 && (
              <Link href={pageHref(data.page - 1)}>← Previous</Link>
            )}
            {data.page * data.pageSize < data.total && (
              <Link href={pageHref(data.page + 1)}>Next →</Link>
            )}
          </nav>
        </>
      )}
    </AdminShell>
  );
}
