import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  BriefcaseBusiness,
  Inbox,
  CalendarClock,
  BellRing,
  Plus,
  Search,
} from "lucide-react";
import type { getAgencyDashboard } from "@/lib/data/client-workspaces";
import { displayDate, displayTimestamp } from "@/lib/client-workspaces";
import { WorkspaceSetupNotice } from "@/components/admin/workspace-status";
type Data = Awaited<ReturnType<typeof getAgencyDashboard>>;
export function AgencyDashboard({ data }: { data: Data }) {
  const count = (key: string) =>
    data.queues.find((q) => q.key === key)?.total ?? 0;
  const stats = [
    {
      title: "Active clients",
      value: data.activeClients,
      Icon: BriefcaseBusiness,
    },
    { title: "New inquiries", value: count("inquiries"), Icon: Inbox },
    {
      title: "Lead follow-ups due",
      value: count("followups"),
      Icon: CalendarClock,
    },
    {
      title: "Notification failures",
      value: count("notifications"),
      Icon: BellRing,
    },
  ];
  return (
    <>
      <header className="admin-heading agency-dashboard-heading">
        <div>
          <p className="eyebrow">Agency workspace</p>
          <h1>Make the next step clear.</h1>
          <p>Your client work, conversations, and commitments in view.</p>
        </div>
        <div className="workspace-actions">
          {data.workspaceReady && (
            <Link className="button" href="/admin-portal/clients/new">
              <Plus size={17} aria-hidden="true" />
              New client workspace
            </Link>
          )}
          <Link className="button button-secondary" href="/admin-portal/leads">
            View inquiries
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>
      <section className="workspace-dashboard-strip">
        <span className="workspace-live-dot" aria-hidden="true" />
        <span>Today’s workspace</span>
        <strong>{displayDate(data.today)}</strong>
        <span className="field-help">Dates use Chicago time</span>
      </section>
      <section
        className="metric-grid workspace-metrics"
        aria-label="Agency overview"
      >
        {stats.map(({ title, value, Icon }) => (
          <article className="metric-card" key={title}>
            <Icon size={23} aria-hidden="true" />
            <span>{title}</span>
            <strong>{value ?? "—"}</strong>
          </article>
        ))}
      </section>
      {!data.workspaceReady && (
        <WorkspaceSetupNotice unavailable={data.workspaceError} />
      )}
      <section className="workspace-dashboard-main">
        <div className="attention-queues">
          <div className="workspace-section-heading">
            <p className="eyebrow">Where your attention helps</p>
            <h2>Work that needs a next step.</h2>
          </div>
          {data.queues.map((queue) => (
            <article
              className={`admin-card attention-queue queue-${queue.key}`}
              key={queue.key}
            >
              <div className="card-heading">
                <div>
                  <h3>{queue.title}</h3>
                  <p>{queue.description}</p>
                </div>
                <span
                  className={`workspace-queue-count${queue.total ? " has-items" : ""}`}
                >
                  {queue.total}
                </span>
              </div>
              {queue.items.length ? (
                <>
                  <ul>
                    {queue.items.map((item) => (
                      <li key={item.id}>
                        <Link href={item.href}>
                          <div>
                            <strong>{item.title}</strong>
                            <span>{item.detail}</span>
                            {item.date && (
                              <small
                                className={
                                  item.urgent ? "workspace-date-urgent" : ""
                                }
                              >
                                {item.date.includes("T")
                                  ? displayTimestamp(new Date(item.date))
                                  : displayDate(item.date)}
                              </small>
                            )}
                          </div>
                          <ArrowUpRight size={19} aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {queue.total > queue.items.length && (
                    <p className="field-help">
                      Showing {queue.items.length} of {queue.total}. Open the
                      relevant client or lead list for more.
                    </p>
                  )}
                </>
              ) : (
                <p className="workspace-empty">Nothing waiting here.</p>
              )}
            </article>
          ))}
        </div>
        <aside className="workspace-dashboard-aside">
          <article className="workspace-guide-card">
            <span className="workspace-guide-orbit" aria-hidden="true" />
            <p className="eyebrow">A practical sequence</p>
            <h2>
              Conversation.
              <br />
              Scope.
              <br />
              <span>Build.</span>
            </h2>
            <ol>
              <li>Read the inquiry and set a follow-up.</li>
              <li>Create or open the client workspace.</li>
              <li>Capture the goals, systems, and dependencies.</li>
              <li>Review a discovery brief before quoting.</li>
              <li>Keep the next action and milestone current.</li>
            </ol>
            <Link href="/admin-portal/clients" className="text-link">
              Open client workspaces <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </article>
          <article className="admin-card">
            <h2>Find an existing record</h2>
            <form
              action="/admin-portal/leads"
              method="get"
              className="workspace-search"
            >
              <label>
                Search leads
                <input
                  name="q"
                  maxLength={120}
                  placeholder="Company, contact, or domain"
                />
              </label>
              <button className="button button-secondary">
                <Search size={16} aria-hidden="true" />
                Search
              </button>
            </form>
          </article>
          <article className="admin-card">
            <p className="eyebrow">Still available</p>
            <h2>Your supporting tools</h2>
            <p className="field-help">
              Imports, preflight checks, audits, suppression records, pricing,
              and analytics remain in the portal.
            </p>
            <Link className="text-link" href="/admin-portal/tools">
              Prospecting & review overview →
            </Link>
            <Link className="text-link" href="/admin-portal/pricing">
              Private pricing catalog →
            </Link>
          </article>
        </aside>
      </section>
    </>
  );
}
