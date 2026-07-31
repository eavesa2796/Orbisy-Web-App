import { desc } from "drizzle-orm";
import { createSuppressionAction } from "@/app/admin-portal/suppressions/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { suppressionEntries } from "@/lib/db/schema";

export default async function SuppressionsPage() {
  const admin = await requireAdmin();
  const entries = await getDb()
    .select()
    .from(suppressionEntries)
    .orderBy(desc(suppressionEntries.createdAt))
    .limit(100);
  return (
    <AdminShell email={admin.email}>
      <header className="admin-heading"><div><p className="eyebrow">Do-not-contact controls</p><h1>Suppressions</h1><p>Suppression checks run before import confirmation and do not expire automatically.</p></div></header>
      <section className="admin-grid">
        <article className="admin-card">
          <h2>Add a suppression</h2>
          <form action={createSuppressionAction} className="admin-form single-column">
            <label>Type<select name="type"><option value="email">Email</option><option value="domain">Domain</option><option value="phone">Phone</option><option value="source_identifier">Source identifier</option></select></label>
            <label>Value<input name="value" required maxLength={500} /></label>
            <label>Reason<textarea name="reason" rows={3} required maxLength={1000} /></label>
            <button className="button button-primary" type="submit">Add suppression</button>
          </form>
        </article>
        <article className="admin-card">
          <h2>Active entries</h2>
          {entries.length ? <ul className="admin-list">{entries.map((entry) => {
            const value = entry.normalizedEmail || entry.normalizedDomain || entry.normalizedPhone || entry.normalizedSourceIdentifier || "Lead-level suppression";
            return <li key={entry.id}><div><strong>{value}</strong><span>{entry.type.replaceAll("_", " ")} · {entry.reason}</span></div><small>{entry.createdAt.toLocaleDateString()}</small></li>;
          })}</ul> : <p className="muted">No standalone suppression entries.</p>}
        </article>
      </section>
    </AdminShell>
  );
}
