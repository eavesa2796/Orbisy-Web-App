import Link from "next/link";
import { ToolGuide } from "@/components/admin/tool-guide";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTimestamp } from "@/components/admin/admin-timestamp";
import { PricingEditor } from "@/components/admin/pricing-editor";
import { PricingReference } from "@/components/admin/pricing-reference";
import { requireAdmin } from "@/lib/auth";
import { getPricingEntries } from "@/lib/data/pricing";
import { billingLabels, formatMoney, formatPricingAmount, isLegacyPricing, pricingCategories } from "@/lib/pricing";
import { addPricingTemplatesAction } from "./actions";
import "@/components/admin/sales-overview.css";
export default async function PricingPage({searchParams}: {searchParams: Promise<{category?: string; status?: string; offer?: string}>}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const offer = params.offer === "legacy" || params.offer === "all" ? params.offer : "current";
  let entries: Awaited<ReturnType<typeof getPricingEntries>> | null = null;
  try { entries = await getPricingEntries(); } catch {}
  const legacyCount = entries?.filter(isLegacyPricing).length ?? 0;
  const shown = entries?.filter(e => (!params.category || e.category === params.category) && (!params.status || e.status === params.status) && (offer === "all" || (offer === "legacy" ? isLegacyPricing(e) : !isLegacyPricing(e))));
  return <AdminShell email={admin.email}>
    <header className="admin-heading"><div><p className="eyebrow">Private catalog</p><h1>Pricing</h1><p>Association websites, member functionality, integrations, and separately scoped care and development. This catalog is administrator-only.</p></div></header>
    <ToolGuide tool="pricing" />
    <PricingReference />
    {entries === null ? <section className="admin-card"><h2>Database setup needed</h2><p>The catalog is unavailable. Confirm the database connection and apply the reviewed pricing-ranges migration before saving. No entries have been changed.</p></section> : <>
      <section className="admin-card">
        <div className="card-heading"><h2>Saved catalog ({shown?.length ?? 0})</h2><form action={addPricingTemplatesAction}><button className="button button-secondary">Add association pricing drafts</button></form></div>
        <p className="notice">Draft = proposed and needs review. Active = approved by you for internal quoting. Archived = retired. No status publishes pricing to the website.</p>
        {legacyCount > 0 && <p>{legacyCount} earlier-offer entries are preserved in <Link href="/admin-portal/pricing?offer=legacy">Legacy entries</Link>. Review or archive them individually; existing prices and notes have not been overwritten.</p>}
        <form className="filter-row">
          <label>Offer<select name="offer" defaultValue={offer}><option value="current">Current association offer</option><option value="legacy">Legacy entries</option><option value="all">All preserved entries</option></select></label>
          <label>Category<select name="category" defaultValue={params.category ?? ""}><option value="">All categories</option>{Object.entries(pricingCategories).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Status<select name="status" defaultValue={params.status ?? ""}><option value="">All statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select></label>
          <button className="button button-secondary">Filter catalog</button>
        </form>
        {!shown?.length && <p className="muted">No entries in this view. Add association pricing drafts to save the ranges above, create your own entry, or change the filters.</p>}
        {shown?.map(entry => <details className="pricing-entry" key={`${entry.id}-${entry.updatedAt.toISOString()}`}>
          <summary><span><strong>{entry.name}</strong><small>{pricingCategories[entry.category]} · {billingLabels[entry.billingBasis]}</small></span><span>{formatPricingAmount(entry)} · {entry.status === "draft" ? "Draft · needs review" : entry.status}</span></summary>
          <dl className="detail-list"><div><dt>Setup fee</dt><dd>{formatMoney(entry.setupFeeCents)}</dd></div><div><dt>Additional recurring fee</dt><dd>{formatMoney(entry.recurringFeeCents)} {entry.recurringInterval}</dd></div><div><dt>Last edited · Chicago time</dt><dd><AdminTimestamp date={entry.updatedAt} />{entry.updatedBy}</dd></div></dl>
          <PricingEditor entry={entry} />
        </details>)}
      </section>
      <details className="admin-card disclosure"><summary>Add a custom service or add-on</summary><PricingEditor /></details>
    </>}
  </AdminShell>;
}
