import { EmailWorkerHealth } from "@/components/admin/email-worker-health";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { AgencyDashboard } from "@/components/admin/agency-dashboard";
import { requireAdmin } from "@/lib/auth";
import { getAgencyDashboard } from "@/lib/data/client-workspaces";
export default async function DashboardPage() {
  const admin = await requireAdmin();
  let data: Awaited<ReturnType<typeof getAgencyDashboard>> | null = null;
  try {
    data = await getAgencyDashboard();
  } catch {}
  return (
    <AdminShell email={admin.email}>
      {data ? (
        <AgencyDashboard data={data} />
      ) : (
        <>
          <header className="admin-heading">
            <div>
              <p className="eyebrow">Agency workspace</p>
              <h1>Your work, in view.</h1>
            </div>
          </header>
          <section className="admin-card">
            <h2>Dashboard data is temporarily unavailable</h2>
            <p>
              Check the database connection and migrations, then refresh. No
              sample client activity is shown.
            </p>
            <div className="workspace-actions">
              <Link
                className="button button-secondary"
                href="/admin-portal/leads"
              >
                Open existing leads
              </Link>
              <Link className="text-link" href="/admin-portal/notifications">
                Review notifications →
              </Link>
            </div>
          </section>
        </>
      )}
      <EmailWorkerHealth />
    </AdminShell>
  );
}
