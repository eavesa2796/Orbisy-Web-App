import Link from "next/link";
export function WorkspaceSetupNotice({
  unavailable = false,
}: {
  unavailable?: boolean;
}) {
  return (
    <section className="admin-card workspace-setup" role="status">
      <p className="eyebrow">Client workspace</p>
      <h2>
        {unavailable
          ? "Workspace data is temporarily unavailable"
          : "Client workspace setup is needed"}
      </h2>
      <p>
        {unavailable
          ? "The existing lead and notification tools remain available. Refresh later or check the database connection."
          : "The private workspace tables have not been installed in this database yet. Apply migration 0009_client_workspaces to the confirmed target before saving client work."}
      </p>
      <Link className="text-link" href="/admin-portal/leads">
        Open existing leads →
      </Link>
    </section>
  );
}
