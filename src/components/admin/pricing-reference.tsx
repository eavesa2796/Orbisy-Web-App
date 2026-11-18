import { suggestedPricingDraft } from "@/lib/pricing-draft";
export function PricingReference() {
  return <section className="admin-card">
    <p className="eyebrow">Current association offer</p>
    <h2>Proposed price ranges · USD</h2>
    <p className="notice">These are concrete starting ranges for your review, not confirmed Orbisy rates or market benchmarks. Most build estimates use a proposed $125/hour planning rate; validate the work and margin before quoting. Projects need a written scope. Platform subscriptions, hosting, vendor/API fees, taxes, and larger changes are separate unless explicitly included.</p>
    <p>Use “Add association pricing drafts” to save editable copies. Existing entries are preserved. Repeating that action will not overwrite edits. Keep entries Draft until you approve them; Active is an internal quoting reference and does not publish prices.</p>
    <div className="table-wrap" tabIndex={0} role="region" aria-label="Proposed association pricing ranges">
      <table><thead><tr><th>Engagement</th><th>Proposed range</th><th>Included scope & boundaries</th></tr></thead><tbody>
        {suggestedPricingDraft.map(([name,amount,note]) => <tr key={name}><td><strong>{name}</strong></td><td>{amount}</td><td>{note}</td></tr>)}
      </tbody></table>
    </div>
  </section>;
}
