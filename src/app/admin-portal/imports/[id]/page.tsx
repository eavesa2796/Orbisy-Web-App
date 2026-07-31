import Link from "next/link";
import { notFound } from "next/navigation";
import { confirmImportAction } from "@/app/admin-portal/imports/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getImportBatch } from "@/lib/imports/service";

export default async function ImportBatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ confirmed?: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const data = await getImportBatch(id);
  if (!data.batch) notFound();
  const batch = data.batch;
  const confirmed = (await searchParams).confirmed === "1";
  const canConfirm = !batch.confirmedAt &&
    !["importing", "completed", "cancelled", "failed"].includes(batch.status);

  return (
    <AdminShell email={admin.email}>
      <header className="admin-heading">
        <div><p className="eyebrow">Import batch</p><h1>{batch.originalFilename}</h1><p>{batch.sourceName} · {batch.createdAt.toLocaleString()}</p></div>
        <div className="copy-actions">
          <a className="button button-secondary" href={`/api/admin/imports/${id}/rejected`}>Download rejected rows</a>
          <Link className="button button-secondary" href="/admin-portal/imports">All imports</Link>
        </div>
      </header>
      {confirmed && <p className="notice" role="status">Import confirmation completed. Rows requiring a decision remain in the review queue.</p>}
      <section className="metric-grid">
        <article className="metric-card"><span>Total rows</span><strong>{batch.totalRows}</strong></article>
        <article className="metric-card"><span>Ready</span><strong>{data.candidates.filter((item) => item.status === "ready").length}</strong></article>
        <article className="metric-card"><span>Duplicates</span><strong>{batch.duplicateRows}</strong></article>
        <article className="metric-card"><span>Suppressed</span><strong>{batch.suppressedRows}</strong></article>
      </section>
      <section className="admin-card">
        <div className="card-heading"><div><h2>Row preview</h2><p className="muted">Original values remain stored separately from normalized comparison fields.</p></div>
          {canConfirm && (
            <form action={confirmImportAction.bind(null, id)}>
              <button className="button button-primary" type="submit">Confirm ready rows</button>
            </form>
          )}
        </div>
        <div className="table-wrap"><table><thead><tr><th>Row</th><th>Business</th><th>Location</th><th>Website</th><th>Classification</th><th>Result</th></tr></thead><tbody>
          {data.candidates.map((candidate) => (
            <tr key={candidate.id}>
              <td>{candidate.originalRowNumber}</td>
              <td><strong>{candidate.businessName || "Invalid row"}</strong><span>{candidate.email || candidate.phone || "No public contact listed"}</span></td>
              <td>{[candidate.city, candidate.state].filter(Boolean).join(", ") || candidate.location || "—"}</td>
              <td>{candidate.normalizedDomain || "No website listed"}</td>
              <td><span className="status-pill">{candidate.duplicateClassification.replaceAll("_", " ")}</span>{candidate.duplicateReasons.map((reason) => <span key={reason}>{reason}</span>)}</td>
              <td><span className="status-pill">{candidate.status.replaceAll("_", " ")}</span>{candidate.validationErrors.map((error) => <span className="error-text" key={error}>{error}</span>)}</td>
            </tr>
          ))}
        </tbody></table></div>
      </section>
    </AdminShell>
  );
}
