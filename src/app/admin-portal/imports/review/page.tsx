import Link from "next/link";
import { decideCandidateAction } from "@/app/admin-portal/imports/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getReviewCandidates } from "@/lib/imports/service";

export default async function ImportReviewPage() {
  const admin = await requireAdmin();
  const candidates = await getReviewCandidates();
  return (
    <AdminShell email={admin.email}>
      <header className="admin-heading"><div><p className="eyebrow">Manual decision required</p><h1>Import review queue</h1><p>Uncertain matches are never merged silently.</p></div><Link className="button button-secondary" href="/admin-portal/imports">Back to imports</Link></header>
      {candidates.length ? <div className="review-stack">{candidates.map((candidate) => (
        <article className="admin-card review-card" key={candidate.id}>
          <div className="card-heading"><div><h2>{candidate.businessName}</h2><p className="muted">Row {candidate.originalRowNumber} · {candidate.sourceName}</p></div><span className="status-pill">{candidate.duplicateClassification.replaceAll("_", " ")}</span></div>
          <dl className="detail-list">
            <div><dt>Domain</dt><dd>{candidate.normalizedDomain || "No website listed"}</dd></div>
            <div><dt>Location</dt><dd>{[candidate.city, candidate.state].filter(Boolean).join(", ") || candidate.location || "—"}</dd></div>
            <div><dt>Public contact</dt><dd>{candidate.email || candidate.phone || "—"}</dd></div>
            <div><dt>Why flagged</dt><dd>{candidate.duplicateReasons.join("; ") || candidate.validationWarnings.join("; ")}</dd></div>
          </dl>
          {candidate.matchedLeadId && <Link className="text-link" href={`/admin-portal/leads/${candidate.matchedLeadId}`}>Review possible existing lead</Link>}
          <form action={decideCandidateAction.bind(null, candidate.id)} className="decision-form">
            <label>Decision<select name="decision" defaultValue="skip"><option value="skip">Skip</option><option value="mark_duplicate">Mark duplicate</option>{candidate.matchedLeadId && <option value="update_existing">Fill missing fields on existing lead</option>}<option value="import_as_new">Import as new after review</option><option value="suppress">Suppress</option></select></label>
            <label>Decision notes<input name="reason" maxLength={500} placeholder="Why this decision is appropriate" /></label>
            <button className="button button-primary" type="submit">Record decision</button>
          </form>
        </article>
      ))}</div> : <section className="admin-card empty-state"><h2>Review queue is clear</h2><p>No uncertain import candidates need a decision.</p></section>}
    </AdminShell>
  );
}
