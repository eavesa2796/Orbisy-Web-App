import { AdminShell } from "@/components/admin/admin-shell";
import { PricingEditor } from "@/components/admin/pricing-editor";
import { requireAdmin } from "@/lib/auth";
import { getPricingEntries } from "@/lib/data/pricing";
import { billingLabels, formatMoney, pricingCategories } from "@/lib/pricing";
import { suggestedPricingDraft } from "@/lib/pricing-draft";
import { addPricingTemplatesAction } from "./actions";
export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>;
}) {
  const admin = await requireAdmin(),
    params = await searchParams;
  let entries: Awaited<ReturnType<typeof getPricingEntries>> | null = null;
  try {
    entries = await getPricingEntries();
  } catch {}
  const shown = entries?.filter(
    (e) =>
      (!params.category || e.category === params.category) &&
      (!params.status || e.status === params.status),
  );
  return (
    <AdminShell email={admin.email}>
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Private catalog</p>
          <h1>Pricing</h1>
          <p>
            Services, packages, and optional deliverables. This catalog is
            visible only to the administrator.
          </p>
        </div>
      </header>
      <p className="notice">
        No actual rates have been assumed. Blank means unset, including in the
        standard templates. Active entries remain private; this page does not
        publish pricing.
      </p>
      {entries === null ? (
        <section className="admin-card">
          <h2>Database setup needed</h2>
          <p>
            Connect the intended database and apply migration
            0008_agency_pricing_notifications before managing this catalog.
          </p>
        </section>
      ) : (
        <>
          <section className="admin-card">
            <div className="card-heading">
              <h2>Catalog entries ({shown?.length ?? 0})</h2>
              <form action={addPricingTemplatesAction}>
                <button className="button button-secondary">
                  Add standard services with unset prices
                </button>
              </form>
            </div>
            <form className="filter-row">
              <label>
                Category
                <select name="category" defaultValue={params.category ?? ""}>
                  <option value="">All categories</option>
                  {Object.entries(pricingCategories).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select name="status" defaultValue={params.status ?? ""}>
                  <option value="">All statuses</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <button className="button button-secondary">
                Filter catalog
              </button>
            </form>
            {!shown?.length && (
              <p className="muted">
                Add an entry or standard service templates to begin. Template
                amounts are all unset.
              </p>
            )}
            {shown?.map((entry) => (
              <details
                className="pricing-entry"
                key={`${entry.id}-${entry.updatedAt.toISOString()}`}
              >
                <summary>
                  <span>
                    <strong>{entry.name}</strong>
                    <small>
                      {pricingCategories[entry.category]} ·{" "}
                      {billingLabels[entry.billingBasis]}
                    </small>
                  </span>
                  <span>
                    {formatMoney(entry.amountCents)} · {entry.status}
                  </span>
                </summary>
                <dl className="detail-list">
                  <div>
                    <dt>Setup fee</dt>
                    <dd>{formatMoney(entry.setupFeeCents)}</dd>
                  </div>
                  <div>
                    <dt>Recurring fee</dt>
                    <dd>
                      {formatMoney(entry.recurringFeeCents)}{" "}
                      {entry.recurringInterval}
                    </dd>
                  </div>
                  <div>
                    <dt>Last edited</dt>
                    <dd>
                      {entry.updatedAt.toLocaleString()} · {entry.updatedBy}
                    </dd>
                  </div>
                </dl>
                <PricingEditor entry={entry} />
              </details>
            ))}
          </section>
          <details className="admin-card disclosure">
            <summary>Add a custom service, package, or add-on</summary>
            <PricingEditor />
          </details>
        </>
      )}
      <details className="admin-card disclosure">
        <summary>Suggested pricing draft — owner review only</summary>
        <p className="notice">
          These are proposed starting ranges for review, not Orbisy’s confirmed
          rates or market benchmarks. They are separate from your persisted
          catalog and are never applied automatically. Estimate delivery hours,
          overhead, margin, support obligations, and local demand before
          approving a rate.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Engagement</th>
                <th>Proposed draft</th>
                <th>Scope assumptions</th>
              </tr>
            </thead>
            <tbody>
              {suggestedPricingDraft.map(([name, amount, note]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{amount}</td>
                  <td>{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </AdminShell>
  );
}
