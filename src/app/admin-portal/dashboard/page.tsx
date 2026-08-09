import Link from "next/link";
import { ArrowRight, CalendarCheck, FilePlus2, FileUp, Handshake, Inbox, PhoneCall, Search, Truck, UsersRound } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getOverviewData } from "@/lib/data/admin";

export default async function DashboardPage() {
  const admin = await requireAdmin();
  let data: Awaited<ReturnType<typeof getOverviewData>> | null = null;
  try { data = await getOverviewData(); } catch {}
  const count = (status: string) => data?.counts.find((item) => item.status === status)?.count ?? 0;

  return <AdminShell email={admin.email}>
    <header className="admin-heading"><div><p className="eyebrow">Grease-interceptor evidence operations</p><h1>What should I do next?</h1><p>Move hauler prospects from first conversation to a small, measurable pilot.</p></div><Link className="button button-primary" href="/admin-portal/leads#manual-entry">Add prospect</Link></header>
    {!data ? <section className="admin-card empty-state"><h2>Connect PostgreSQL to activate the workspace</h2><p>Add <code>DATABASE_URL</code>, run the migrations, and refresh. No sample activity is invented.</p></section> : <>
      <section className="admin-card company-search-card" aria-labelledby="company-search-title">
        <div><p className="eyebrow">Prospect workspace</p><h2 id="company-search-title">Find a hauler, restaurant group, or partner</h2><p>Search by business, contact, phone, territory, or source.</p></div>
        <form action="/admin-portal/leads" method="get" role="search"><label className="sr-only" htmlFor="dashboard-company-search">Search prospects</label><Search aria-hidden="true" size={18} /><input id="dashboard-company-search" name="q" placeholder="Business, contact, phone, or city" type="search" /><button className="button button-primary" type="submit">Search pipeline</button></form>
        <div className="company-search-actions"><Link href="/admin-portal/leads#manual-entry"><FilePlus2 size={16} /> Add manually</Link><Link href="/admin-portal/imports"><FileUp size={16} /> Import call list</Link><Link href="/admin-portal/leads?status=contact_planned">Open today&apos;s outreach <ArrowRight size={16} /></Link></div>
      </section>
      <section className="metric-grid" aria-label="Sales summary">
        <article className="metric-card"><Truck /><span>Hauler prospects</span><strong>{data.salesSummary.haulerProspects}</strong></article>
        <article className="metric-card"><Inbox /><span>New inbound</span><strong>{count("new_inbound")}</strong></article>
        <article className="metric-card"><Handshake /><span>Active opportunities</span><strong>{data.salesSummary.activeOpportunities}</strong></article>
        <article className="metric-card"><CalendarCheck /><span>Follow-ups due</span><strong>{data.due.length}</strong></article>
      </section>
      <section className="admin-card action-queue"><div className="card-heading"><div><p className="eyebrow">Daily sales sequence</p><h2>Action queue</h2></div></div><ol>
        <li><Link href="/admin-portal/leads?status=new_inbound"><strong>Reply to new inbound requests</strong></Link><span>{count("new_inbound")} waiting</span></li>
        <li><Link href="/admin-portal/leads?view=follow_up_due"><strong>Complete scheduled follow-ups</strong></Link><span>{data.due.length} due</span></li>
        <li><Link href="/admin-portal/leads?status=contact_planned"><strong>Make planned hauler calls</strong></Link><span>{count("contact_planned")} planned</span></li>
        <li><Link href="/admin-portal/leads?status=replied"><strong>Qualify interested replies</strong></Link><span>{count("replied")} replies</span></li>
        <li><Link href="/admin-portal/leads?status=consultation"><strong>Prepare workflow-review meetings</strong></Link><span>{count("consultation")} meetings</span></li>
        <li><Link href="/admin-portal/leads?status=proposal_sent"><strong>Advance pilot proposals</strong></Link><span>{count("proposal_sent")} proposals</span></li>
      </ol></section>
      <section className="admin-grid">
        <article className="admin-card"><div className="card-heading"><div><p className="eyebrow">Priority one</p><h2>Inbound requests</h2></div><Inbox /></div>{data.inbound.length ? <ul className="admin-list">{data.inbound.map((lead) => <li key={lead.id}><div><strong>{lead.businessName}</strong><span>Requested a conversation</span></div><Link href={`/admin-portal/leads/${lead.id}`}><ArrowRight /></Link></li>)}</ul> : <p className="muted">No new inbound requests.</p>}</article>
        <article className="admin-card"><div className="card-heading"><div><p className="eyebrow">Priority two</p><h2>Follow-ups due</h2></div><PhoneCall /></div>{data.due.length ? <ul className="admin-list">{data.due.map((lead) => <li key={lead.id}><div><strong>{lead.businessName}</strong><span>{lead.followUpAt?.toLocaleDateString()}</span></div><Link href={`/admin-portal/leads/${lead.id}`}><ArrowRight /></Link></li>)}</ul> : <p className="muted">Nothing is overdue.</p>}</article>
      </section>
      <section className="admin-card"><div className="card-heading"><div><p className="eyebrow">Weekly target</p><h2>Keep the pipeline moving</h2></div><UsersRound /></div><p className="muted">Aim for 25–35 hauler calls, three decision-maker conversations, and one or two workflow reviews. Record every attempt and schedule the next action before closing a lead.</p></section>
    </>}
  </AdminShell>;
}
