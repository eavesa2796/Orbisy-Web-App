import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { createLeadAction } from "@/app/admin-portal/actions";
import { requireAdmin } from "@/lib/auth";
import { getLeadFilterOptions, getLeads, type LeadStatus } from "@/lib/data/admin";
import { getImportSettings } from "@/lib/imports/service";
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
  searchParams: Promise<{
    status?: string; q?: string; page?: string; source?: string;
    industry?: string; location?: string; websiteState?: string; view?: string;
  }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const status = leadStatusValues.includes(params.status as LeadStatus)
    ? (params.status as LeadStatus) : undefined;
  const [filterOptions, settings] = await Promise.all([
    getLeadFilterOptions(),
    getImportSettings(),
  ]);
  let result: Awaited<ReturnType<typeof getLeads>> | null = null;
  try {
    result = await getLeads({
      status, query: params.q, page: Number(params.page) || 1,
      source: params.source, industry: params.industry, location: params.location,
      websiteState: ["unknown", "provided", "not_listed"].includes(params.websiteState || "")
        ? params.websiteState as "unknown" | "provided" | "not_listed" : undefined,
      view: params.view,
      pageSize: settings.defaultPageSize,
    });
  } catch {}
  const pageHref = (page: number) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value && key !== "page") query.set(key, value);
    });
    query.set("page", String(page));
    return `/admin-portal/leads?${query.toString()}`;
  };

  return (
    <AdminShell email={admin.email}>
      <header className="admin-heading"><div><p className="eyebrow">Pipeline</p><h1>Leads</h1></div></header>
      <section className="admin-card">
        <nav className="saved-views" aria-label="Saved lead views">
          <Link href="/admin-portal/leads?status=new_inbound">New inbound</Link>
          <Link href="/admin-portal/leads?status=manually_added">Manually added</Link>
          <Link href="/admin-portal/leads?view=newly_imported">Newly imported</Link>
          <Link href="/admin-portal/leads?view=no_website">No website listed</Link>
          <Link href="/admin-portal/imports/review">Possible duplicates</Link>
          <Link href="/admin-portal/leads?status=needs_review">Needs review</Link>
          <Link href="/admin-portal/leads?view=follow_up_due">Follow-up due</Link>
          <Link href="/admin-portal/leads?status=suppressed">Suppressed</Link>
        </nav>
        <form className="filter-row">
          <label><span>Search</span><input name="q" defaultValue={params.q} placeholder="Business, contact, or email" /></label>
          <label><span>Status</span><select name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{leadStatusValues.map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select></label>
          <label><span>Source</span><select name="source" defaultValue={params.source ?? ""}><option value="">All sources</option>{filterOptions.sources.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Industry</span><select name="industry" defaultValue={params.industry ?? ""}><option value="">All industries</option>{filterOptions.industries.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Location</span><input name="location" defaultValue={params.location} placeholder="Chicago" /></label>
          <label><span>Website state</span><select name="websiteState" defaultValue={params.websiteState ?? ""}><option value="">Any website state</option><option value="provided">Website provided</option><option value="not_listed">No website listed</option><option value="unknown">Unknown</option></select></label>
          <button className="button button-secondary" type="submit">Filter</button>
        </form>
        {!result ? <p className="muted">Connect the database to manage leads.</p> :
          result.items.length ? (
            <div className="table-wrap"><table><thead><tr><th>Business</th><th>Status</th><th>Source</th><th>Follow-up</th></tr></thead><tbody>
              {result.items.map((lead) => <tr key={lead.id}><td><Link href={`/admin-portal/leads/${lead.id}`}><strong>{lead.businessName}</strong></Link><span>{lead.contactName || lead.email || "No contact yet"}</span></td><td><span className="status-pill">{labels[lead.status]}</span></td><td>{lead.sourceName}</td><td>{lead.followUpAt?.toLocaleDateString() ?? "—"}</td></tr>)}
            </tbody></table></div>
          ) : <div className="empty-state"><h2>No leads match this view</h2><p>Adjust the filter or add a permitted lead manually.</p></div>}
        {result && result.total > result.pageSize && (
          <nav className="pagination" aria-label="Lead pages">
            {result.page > 1 ? <Link className="button button-secondary" href={pageHref(result.page - 1)}>Previous</Link> : <span />}
            <span>Page {result.page} of {Math.ceil(result.total / result.pageSize)}</span>
            {result.page * result.pageSize < result.total ? <Link className="button button-secondary" href={pageHref(result.page + 1)}>Next</Link> : <span />}
          </nav>
        )}
      </section>

      <details className="admin-card disclosure">
        <summary>Add a lead manually</summary>
        <form action={createLeadAction} className="admin-form">
          <label>Business name<input name="businessName" required maxLength={160} /></label>
          <label>Contact name<input name="contactName" maxLength={100} /></label>
          <label>Email<input name="email" type="email" maxLength={254} /></label>
          <label>Website URL<input name="websiteUrl" type="url" placeholder="https://" /></label>
          <label>Category<input name="category" /></label>
          <label>Industry<input name="industry" /></label>
          <label>Street address<input name="address" /></label>
          <label>City<input name="city" /></label>
          <label>State<input name="state" /></label>
          <label>Postal code<input name="postalCode" /></label>
          <label>Public business phone<input name="phone" type="tel" /></label>
          <label>Location<input name="location" placeholder="Chicago, IL" /></label>
          <label>Source name<input name="sourceName" required placeholder="Manual research" /></label>
          <label>Source URL<input name="sourceUrl" type="url" placeholder="https://" /></label>
          <label>Source identifier<input name="sourceIdentifier" /></label>
          <button className="button button-primary" type="submit">Add lead</button>
        </form>
      </details>
    </AdminShell>
  );
}
