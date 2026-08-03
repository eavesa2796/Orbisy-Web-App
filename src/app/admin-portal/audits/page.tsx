import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAuditQueue } from "@/lib/audits/service";
import { cancelAuditAction, queueAuditsAction, retryAuditAction } from "./actions";

const views = ["eligible", "queued", "running", "needs_verification", "verified", "completed", "completed_with_warnings", "failed", "blocked", "retry_scheduled", "cancelled"];

export default async function AuditsPage({ searchParams }: { searchParams: Promise<{ status?: string; query?: string; page?: string }> }) {
  const admin = await requireAdmin(); const params = await searchParams;
  let data: Awaited<ReturnType<typeof getAuditQueue>> | null = null;
  try { data = await getAuditQueue({ status: params.status || "eligible", query: params.query, page: Number(params.page) || 1 }); } catch {}
  return <AdminShell email={admin.email}>
    <header className="admin-heading"><div><p className="eyebrow">Phase 4</p><h1>Deep audits</h1></div></header>
    <section className="admin-card">
      <form method="get" className="filter-bar"><input type="hidden" name="status" value={params.status || "eligible"}/><label>Search businesses<input name="query" defaultValue={params.query}/></label><button className="button button-secondary">Search</button></form>
      <nav className="saved-views"><Link href="/admin-portal/audits">Eligible, not queued</Link>{views.slice(1).map((view) => <Link key={view} href={`/admin-portal/audits?status=${view}`}>{view.replaceAll("_", " ")}</Link>)}</nav>
      {!data ? <p className="muted">Apply the Phase 4 development migration to view audits.</p> : data.mode === "eligible" ?
        data.eligible.length ? <form action={queueAuditsAction}><div className="table-wrap"><table><thead><tr><th>Select</th><th>Business</th><th>Website</th><th>Eligibility</th></tr></thead><tbody>{data.eligible.map(({ lead, decision }) => <tr key={lead.id}><td><input type="checkbox" name="leadId" value={lead.id} aria-label={`Select ${lead.businessName}`}/></td><td><strong>{lead.businessName}</strong></td><td>{lead.websiteUrl || "Unavailable"}</td><td>{decision.isOverride ? "Administrator approved" : "Eligible"}</td></tr>)}</tbody></table></div><button className="button button-primary">Queue selected audits</button></form> : <div className="empty-state"><h2>No eligible leads waiting</h2><p>Phase 3 eligibility does not start audits automatically.</p></div>
        : data.jobs.length ? <div className="table-wrap"><table><thead><tr><th>Business</th><th>Status</th><th>Attempts</th><th>Scheduled</th><th>Actions</th></tr></thead><tbody>{data.jobs.map(({ job, businessName }) => <tr key={job.id}><td><Link href={`/admin-portal/audits/${job.id}`}><strong>{businessName}</strong></Link></td><td><span className="status-pill">{job.status.replaceAll("_", " ")}</span></td><td>{job.attemptCount}/{job.maxAttempts}</td><td>{job.scheduledAt.toLocaleString()}</td><td><div className="button-row">{["failed", "blocked"].includes(job.status) && <form action={retryAuditAction}><input type="hidden" name="jobId" value={job.id}/><button className="button button-secondary">Retry</button></form>}{["queued", "retry_scheduled"].includes(job.status) && <form action={cancelAuditAction}><input type="hidden" name="jobId" value={job.id}/><button className="button button-secondary">Cancel</button></form>}</div></td></tr>)}</tbody></table></div> : <div className="empty-state"><h2>No audits in this view</h2><p>Choose another status or queue a bounded set of eligible leads.</p></div>}
      {data && <nav className="pagination">{data.page > 1 && <Link href={`/admin-portal/audits?status=${params.status || "eligible"}&page=${data.page - 1}`}>Previous</Link>}{((data.mode === "eligible" ? data.eligible.length : data.jobs.length) === data.pageSize) && <Link href={`/admin-portal/audits?status=${params.status || "eligible"}&page=${data.page + 1}`}>Next</Link>}</nav>}
    </section>
  </AdminShell>;
}
