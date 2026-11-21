import {AdminShell} from "@/components/admin/admin-shell";
import {FollowupWorkspace} from "@/components/admin/followup-workspace";
import {requireAdmin} from "@/lib/auth";
import {getFollowupOverview} from "@/lib/data/followups";
import "@/components/admin/followup-workspace.css";
export const dynamic="force-dynamic";
export default async function FollowupsPage({searchParams}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const connectionNotice = typeof params.notice === "string" ? params.notice : undefined;
  let data: Awaited<ReturnType<typeof getFollowupOverview>> | null = null;
  try {
    data = await getFollowupOverview();
  } catch {}

  return <AdminShell email={admin.email}>
    <header className="admin-heading"><div>
      <p className="eyebrow">Inbound inquiry follow-up</p>
      <h1>Follow-up inbox</h1>
      <p>Review the next email, keep a personal conversation moving, and see what needs your attention.</p>
    </div></header>
    {data ? <FollowupWorkspace data={data} connectionNotice={connectionNotice}/> :
      <section className="admin-card">
        <h2>Follow-up setup needed</h2>
        <p>Apply the reviewed follow-up migration to the intended database before using this workspace. Existing inquiry storage and owner notifications remain separate and available.</p>
      </section>}
  </AdminShell>;
}
