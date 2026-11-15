import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, FileText, MessageSquare, Flag } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  WorkspaceEditor,
  WorkspaceNoteEditor,
  MilestoneEditor,
  LinkLeadEditor,
} from "@/components/admin/workspace-editors";
import { WorkspaceSetupNotice } from "@/components/admin/workspace-status";
import { requireAdmin } from "@/lib/auth";
import {
  getClientWorkspace,
  getWorkspaceContents,
  searchUnlinkedLeads,
  workspaceSchemaAvailable,
} from "@/lib/data/client-workspaces";
import {
  displayDate,
  displayTimestamp,
  workspaceStatuses,
  proposalStatuses,
  briefStatuses,
  milestoneStatuses,
} from "@/lib/client-workspaces";
export default async function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ leadSearch?: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const search = await searchParams;
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
          <h1>Client workspace</h1>
        </header>
        <WorkspaceSetupNotice unavailable={unavailable} />
      </AdminShell>
    );
  const client = await getClientWorkspace(id);
  if (!client) notFound();
  const [data, candidates] = await Promise.all([
    getWorkspaceContents(id),
    searchUnlinkedLeads(search.leadSearch ?? ""),
  ]);
  return (
    <AdminShell email={admin.email}>
      <Link className="text-link workspace-back" href="/admin-portal/clients">
        ← Clients & organizations
      </Link>
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Client workspace</p>
          <h1>{client.name}</h1>
          <p>
            {client.contactName || "Contact not recorded"}
            {client.contactRole ? ` · ${client.contactRole}` : ""}
          </p>
        </div>
        <span className={`workspace-badge status-${client.status}`}>
          {workspaceStatuses[client.status as keyof typeof workspaceStatuses]}
        </span>
      </header>
      <nav className="workspace-tabs" aria-label="Workspace sections">
        {[
          ["overview", "Overview"],
          ["discovery", "Discovery briefs"],
          ["milestones", "Milestones"],
          ["inquiries", "Linked inquiries"],
          ["notes", "Notes"],
          ["workspace-details", "Edit workspace"],
        ].map(([target, label]) => (
          <a href={`#${target}`} key={target}>
            {label}
          </a>
        ))}
      </nav>
      <section className="workspace-overview" id="overview">
        <article className="workspace-next-action">
          <p className="eyebrow">Next action</p>
          <h2>{client.nextAction || "Choose the next useful step."}</h2>
          <p>{displayDate(client.nextActionDate)}</p>
          <a className="text-link" href="#workspace-details">
            Update next action →
          </a>
        </article>
        <article className="admin-card">
          <h2>At a glance</h2>
          <dl className="detail-list">
            <div>
              <dt>Proposal</dt>
              <dd>
                {
                  proposalStatuses[
                    client.proposalStatus as keyof typeof proposalStatuses
                  ]
                }
                {client.proposalUrl && (
                  <>
                    <br />
                    <a
                      href={client.proposalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open proposal ↗
                    </a>
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt>Website / CMS</dt>
              <dd>
                {client.websiteUrl ? (
                  <a
                    href={client.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {client.websiteUrl} ↗
                  </a>
                ) : (
                  "Not recorded"
                )}
                <br />
                {client.cms || "CMS not recorded"}
              </dd>
            </div>
            <div>
              <dt>Support capacity</dt>
              <dd>{client.supportCapacity || "Not agreed / recorded"}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>
                {displayTimestamp(client.updatedAt)} · revision {client.version}
              </dd>
            </div>
          </dl>
        </article>
      </section>
      <section className="admin-card workspace-section" id="discovery">
        <div className="card-heading">
          <div>
            <p className="eyebrow">Scope before development</p>
            <h2>
              <FileText size={19} aria-hidden="true" /> Discovery briefs
            </h2>
          </div>
          <Link
            className="button button-secondary"
            href={`/admin-portal/clients/${id}/discovery/new`}
          >
            New brief
          </Link>
        </div>
        <p className="field-help">
          Internal planning documents. Ready for review does not mean client
          approval or an accepted contract.
        </p>
        {data.briefs.length ? (
          <ul className="admin-list">
            {data.briefs.map((brief) => (
              <li key={brief.id}>
                <div>
                  <strong>{brief.title}</strong>
                  <span>
                    {briefStatuses[brief.status as keyof typeof briefStatuses]}{" "}
                    · revision {brief.version} ·{" "}
                    {displayTimestamp(brief.updatedAt)}
                  </span>
                </div>
                <Link
                  href={`/admin-portal/clients/${id}/discovery/${brief.id}`}
                  aria-label={`Open ${brief.title}`}
                >
                  <ArrowUpRight size={20} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="workspace-empty">
            No briefs yet. Start with the goals, systems, and work to be scoped.
          </p>
        )}
        {data.briefs.length === 50 && (
          <p className="field-help">
            Showing the 50 most recently updated briefs.
          </p>
        )}
      </section>
      <section className="admin-card workspace-section" id="milestones">
        <div className="card-heading">
          <div>
            <p className="eyebrow">Work in view</p>
            <h2>
              <Flag size={19} aria-hidden="true" /> Milestones & blockers
            </h2>
          </div>
        </div>
        <p className="field-help">
          A lightweight reminder list for the agreed work. Blocked and near-term
          milestones appear on the dashboard.
        </p>
        {data.milestones.map((milestone) => (
          <details className="workspace-disclosure" key={milestone.id}>
            <summary>
              <span>
                <strong>{milestone.title}</strong>
                <small>
                  {milestone.project || "Client work"} ·{" "}
                  {displayDate(milestone.dueDate)}
                </small>
              </span>
              <span className={`workspace-badge status-${milestone.status}`}>
                {
                  milestoneStatuses[
                    milestone.status as keyof typeof milestoneStatuses
                  ]
                }
              </span>
            </summary>
            <MilestoneEditor workspaceId={id} entry={milestone} />
          </details>
        ))}
        {data.milestones.length === 50 && (
          <p className="field-help">
            Showing 50 milestones. Open work is shown first.
          </p>
        )}
        <details className="workspace-disclosure">
          <summary>
            Add a milestone <span aria-hidden="true">+</span>
          </summary>
          <MilestoneEditor workspaceId={id} />
        </details>
      </section>
      <section className="admin-card workspace-section" id="inquiries">
        <div className="card-heading">
          <div>
            <p className="eyebrow">Original records stay intact</p>
            <h2>Linked leads & inquiries</h2>
          </div>
        </div>
        {data.links.length ? (
          <ul className="workspace-inquiry-list">
            {data.links.map(({ lead, submission }) => (
              <li key={lead.id}>
                <div className="workspace-inline-heading">
                  <Link href={`/admin-portal/leads/${lead.id}`}>
                    <strong>{lead.businessName} ↗</strong>
                  </Link>
                  <span className="workspace-badge">
                    {lead.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p>{submission?.serviceNeeded || lead.sourceName}</p>
                {submission && (
                  <details>
                    <summary>Read original inquiry</summary>
                    <p className="workspace-preserve">
                      {submission.projectDescription || submission.primaryGoal}
                      {submission.websiteConcern
                        ? `\n${submission.websiteConcern}`
                        : ""}
                    </p>
                    <p className="field-help">
                      {submission.email} ·{" "}
                      {displayTimestamp(submission.submittedAt)}
                    </p>
                  </details>
                )}
                <Link
                  className="text-link"
                  href={`/admin-portal/leads/${lead.id}`}
                >
                  Notes, follow-ups & pipeline history →
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="workspace-empty">
            No linked records. You can link an existing inquiry without creating
            a duplicate lead.
          </p>
        )}
        {data.links.length === 100 && (
          <p className="field-help">
            Showing the 100 most recent linked leads.
          </p>
        )}
        <details className="workspace-disclosure" open={!!search.leadSearch}>
          <summary>
            Link an existing lead <span aria-hidden="true">+</span>
          </summary>
          <form method="get" className="workspace-search">
            <label>
              Search saved leads
              <input
                name="leadSearch"
                maxLength={120}
                defaultValue={search.leadSearch}
                placeholder="Organization or email"
              />
            </label>
            <button className="button button-secondary">Search</button>
          </form>
          {search.leadSearch &&
            (candidates.length ? (
              <>
                <p className="field-help">
                  Showing up to 20 unlinked records. Narrow the search if
                  needed.
                </p>
                <LinkLeadEditor workspaceId={id} leads={candidates} />
              </>
            ) : (
              <p className="workspace-empty">
                No unlinked records match this search.
              </p>
            ))}
        </details>
      </section>
      <section className="admin-card workspace-section" id="notes">
        <div className="card-heading">
          <div>
            <p className="eyebrow">Decisions & context</p>
            <h2>
              <MessageSquare size={19} aria-hidden="true" /> Private notes
            </h2>
          </div>
        </div>
        <WorkspaceNoteEditor workspaceId={id} />
        <ul className="workspace-note-list">
          {data.notes.map((note) => (
            <li key={note.id}>
              <p className="workspace-preserve">{note.body}</p>
              <small>
                {displayTimestamp(note.createdAt)} · {note.createdBy}
              </small>
            </li>
          ))}
        </ul>
        {data.notes.length === 50 && (
          <p className="field-help">Showing the 50 most recent notes.</p>
        )}
      </section>
      <section className="admin-card workspace-section" id="workspace-details">
        <div className="card-heading">
          <div>
            <p className="eyebrow">Contacts · Systems · Scope · Support</p>
            <h2>Edit workspace</h2>
          </div>
        </div>
        <WorkspaceEditor entry={client} />
      </section>
    </AdminShell>
  );
}
