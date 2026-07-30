import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { createLeadAction } from "@/app/admin-portal/actions";
import { requireAdmin } from "@/lib/auth";
import { getLeads, type LeadStatus } from "@/lib/data/admin";
import { leadStatusValues } from "@/lib/validation";

const labels: Record<LeadStatus, string> = {
  new_inbound: "New inbound", manually_added: "Manually added",
  needs_review: "Needs review", qualified: "Qualified",
  contact_planned: "Contact planned", contacted: "Contacted", replied: "Replied",
  consultation: "Consultation", proposal_sent: "Proposal sent", won: "Won",
  lost: "Lost", suppressed: "Suppressed",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const status = leadStatusValues.includes(params.status as LeadStatus)
    ? (params.status as LeadStatus) : undefined;
  let result: Awaited<ReturnType<typeof getLeads>> | null = null;
  try {
    result = await getLeads({ status, query: params.q, page: Number(params.page) || 1 });
  } catch {}

  return (
    <AdminShell email={admin.email}>
      <header className="admin-heading"><div><p className="eyebrow">Pipeline</p><h1>Leads</h1></div></header>
      <section className="admin-card">
        <form className="filter-row">
          <label><span>Search</span><input name="q" defaultValue={params.q} placeholder="Business, contact, or email" /></label>
          <label><span>Status</span><select name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{leadStatusValues.map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select></label>
          <button className="button button-secondary" type="submit">Filter</button>
        </form>
        {!result ? <p className="muted">Connect the database to manage leads.</p> :
          result.items.length ? (
            <div className="table-wrap"><table><thead><tr><th>Business</th><th>Status</th><th>Source</th><th>Follow-up</th></tr></thead><tbody>
              {result.items.map((lead) => <tr key={lead.id}><td><Link href={`/admin-portal/leads/${lead.id}`}><strong>{lead.businessName}</strong></Link><span>{lead.contactName || lead.email || "No contact yet"}</span></td><td><span className="status-pill">{labels[lead.status]}</span></td><td>{lead.sourceName}</td><td>{lead.followUpAt?.toLocaleDateString() ?? "—"}</td></tr>)}
            </tbody></table></div>
          ) : <div className="empty-state"><h2>No leads match this view</h2><p>Adjust the filter or add a permitted lead manually.</p></div>}
      </section>

      <details className="admin-card disclosure">
        <summary>Add a lead manually</summary>
        <form action={createLeadAction} className="admin-form">
          <label>Business name<input name="businessName" required maxLength={160} /></label>
          <label>Contact name<input name="contactName" maxLength={100} /></label>
          <label>Email<input name="email" type="email" maxLength={254} /></label>
          <label>Website URL<input name="websiteUrl" type="url" placeholder="https://" /></label>
          <label>Category<input name="category" /></label>
          <label>Location<input name="location" placeholder="Chicago, IL" /></label>
          <label>Source name<input name="sourceName" required placeholder="Manual research" /></label>
          <label>Source URL<input name="sourceUrl" type="url" placeholder="https://" /></label>
          <button className="button button-primary" type="submit">Add lead</button>
        </form>
      </details>
    </AdminShell>
  );
}
