import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { DiscoveryEditor } from "@/components/admin/workspace-editors";
import { PrintBriefButton } from "@/components/admin/workspace-form";
import { requireAdmin } from "@/lib/auth";
import { getDiscoveryBrief } from "@/lib/data/client-workspaces";
import {
  briefFields,
  briefStatuses,
  displayTimestamp,
} from "@/lib/client-workspaces";
export default async function DiscoveryPage({
  params,
}: {
  params: Promise<{ id: string; briefId: string }>;
}) {
  const admin = await requireAdmin();
  const { id, briefId } = await params;
  const data = await getDiscoveryBrief(briefId, id);
  if (!data) notFound();
  const { workspace, brief } = data;
  return (
    <AdminShell email={admin.email}>
      <Link
        className="text-link workspace-back no-print"
        href={`/admin-portal/clients/${id}#discovery`}
      >
        ← {workspace.name}
      </Link>
      <header className="admin-heading">
        <div>
          <p className="eyebrow">{workspace.name} · Discovery brief</p>
          <h1>{brief.title}</h1>
          <p>
            {briefStatuses[brief.status as keyof typeof briefStatuses]} ·
            revision {brief.version} · {displayTimestamp(brief.updatedAt)}
          </p>
        </div>
        <div className="workspace-actions no-print">
          <PrintBriefButton />
          <a
            className="button button-secondary"
            href={`/api/admin/discovery/${brief.id}`}
          >
            Download brief
          </a>
        </div>
      </header>
      <p className="notice">
        Internal planning brief. Ready for review does not mean client approval
        or an accepted contract.
      </p>
      <article className="admin-card discovery-preview">
        <p className="eyebrow">Saved brief</p>
        {briefFields.map(([key, label]) => (
          <section key={key}>
            <h2>{label}</h2>
            <p className="workspace-preserve">
              {brief.answers[key] || "Not yet recorded."}
            </p>
          </section>
        ))}
      </article>
      <section className="admin-card workspace-section no-print">
        <h2>Edit this brief</h2>
        <DiscoveryEditor workspaceId={id} entry={brief} />
      </section>
    </AdminShell>
  );
}
