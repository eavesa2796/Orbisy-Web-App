import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { CsvImportWizard } from "@/components/admin/csv-import-wizard";
import { requireAdmin } from "@/lib/auth";
import {
  getImportBatches,
  getImportSettings,
} from "@/lib/imports/service";

export default async function ImportsPage() {
  const admin = await requireAdmin();
  const [settings, batches] = await Promise.all([
    getImportSettings(),
    getImportBatches(),
  ]);
  return (
    <AdminShell email={admin.email}>
      <header className="admin-heading">
        <div><p className="eyebrow">Permitted data only</p><h1>Imports</h1><p>Validate and review businesses before they enter the active pipeline.</p></div>
        <Link className="button button-secondary" href="/admin-portal/imports/review">Review queue</Link>
      </header>
      <CsvImportWizard
        maxBytes={settings.maxCsvBytes}
        maxRows={settings.maxRowsPerBatch}
        defaultSourceName={settings.defaultSourceName}
      />
      <details className="admin-card disclosure">
        <summary>CSV requirements and review behavior</summary>
        <ul className="guidance-list">
          <li>Business name is required; all other mapped fields are optional.</li>
          <li>Use complete website and source URLs. URLs without a scheme are normalized to HTTPS.</li>
          <li>Use two-letter US state abbreviations and five- or nine-digit postal codes when possible.</li>
          <li>Exact source IDs, domains, public emails, phones, and repeated batch rows are checked for duplicates.</li>
          <li>Suppression matches are excluded before confirmation. Uncertain matches remain in the review queue.</li>
          <li>Rejected rows include their original row number and validation explanation.</li>
        </ul>
      </details>
      <section className="admin-card import-history">
        <div className="card-heading"><div><p className="eyebrow">Reproducible history</p><h2>Import batches</h2></div></div>
        {batches.length ? (
          <div className="table-wrap"><table><thead><tr><th>File</th><th>Status</th><th>Rows</th><th>Imported</th><th>Created</th></tr></thead><tbody>
            {batches.map((batch) => (
              <tr key={batch.id}>
                <td><Link href={`/admin-portal/imports/${batch.id}`}><strong>{batch.originalFilename}</strong></Link><span>{batch.sourceName}</span></td>
                <td><span className="status-pill">{batch.status.replaceAll("_", " ")}</span></td>
                <td>{batch.totalRows}</td><td>{batch.importedRows}</td>
                <td>{batch.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody></table></div>
        ) : <div className="empty-state"><h2>No import batches</h2><p>Your validated CSV imports will appear here.</p></div>}
      </section>
    </AdminShell>
  );
}
