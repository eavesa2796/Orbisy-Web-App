import Link from "next/link";
import { ArrowRight, Inbox, PhoneForwarded, UsersRound } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getOverviewData } from "@/lib/data/admin";

export default async function DashboardPage() {
  const admin = await requireAdmin();
  let data: Awaited<ReturnType<typeof getOverviewData>> | null = null;
  try {
    data = await getOverviewData();
  } catch {
    // The shell remains useful while the database is being configured.
  }

  const count = (status: string) =>
    data?.counts.find((item) => item.status === status)?.count ?? 0;

  return (
    <AdminShell email={admin.email}>
      <header className="admin-heading">
        <div><p className="eyebrow">Overview</p><h1>What should I do next?</h1></div>
        <Link className="button button-primary" href="/admin-portal/leads">View leads</Link>
      </header>

      {!data ? (
        <section className="admin-card empty-state">
          <h2>Connect PostgreSQL to activate the dashboard</h2>
          <p>Add <code>DATABASE_URL</code>, run the migrations, and refresh. No sample activity is invented.</p>
        </section>
      ) : (
        <>
          <section className="metric-grid" aria-label="Lead summary">
            <article className="metric-card"><Inbox /><span>New inbound</span><strong>{count("new_inbound")}</strong></article>
            <article className="metric-card"><UsersRound /><span>Needs review</span><strong>{count("needs_review")}</strong></article>
            <article className="metric-card"><PhoneForwarded /><span>Follow-ups due</span><strong>{data.due.length}</strong></article>
          </section>

          <section className="admin-grid">
            <article className="admin-card">
              <div className="card-heading"><div><p className="eyebrow">Priority one</p><h2>Inbound requests</h2></div></div>
              {data.inbound.length ? (
                <ul className="admin-list">
                  {data.inbound.map((lead) => (
                    <li key={lead.id}><div><strong>{lead.businessName}</strong><span>Requested a conversation</span></div><Link href={`/admin-portal/leads/${lead.id}`} aria-label={`Open ${lead.businessName}`}><ArrowRight /></Link></li>
                  ))}
                </ul>
              ) : <p className="muted">No new inbound requests.</p>}
            </article>
            <article className="admin-card">
              <div className="card-heading"><div><p className="eyebrow">Priority two</p><h2>Follow-ups due</h2></div></div>
              {data.due.length ? (
                <ul className="admin-list">
                  {data.due.map((lead) => (
                    <li key={lead.id}><div><strong>{lead.businessName}</strong><span>{lead.followUpAt?.toLocaleDateString()}</span></div><Link href={`/admin-portal/leads/${lead.id}`} aria-label={`Open ${lead.businessName}`}><ArrowRight /></Link></li>
                  ))}
                </ul>
              ) : <p className="muted">Nothing is overdue.</p>}
            </article>
          </section>
        </>
      )}
    </AdminShell>
  );
}
