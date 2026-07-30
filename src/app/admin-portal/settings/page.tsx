import { CheckCircle2, CircleDashed } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { hasDatabaseConfig, hasSupabaseConfig } from "@/lib/config";

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const items = [
    ["PostgreSQL", hasDatabaseConfig(), "Required for forms, leads, and analytics"],
    ["Supabase authentication", hasSupabaseConfig(), "Required for administrator sign-in"],
    ["Administrator allowlist", Boolean(process.env.ADMIN_EMAIL), "Must match the sole Supabase administrator"],
    ["Turnstile spam protection", Boolean(process.env.TURNSTILE_SECRET_KEY), "Required before production form launch"],
    ["Inbound notifications", Boolean(process.env.RESEND_API_KEY), "Optional; form storage works without email"],
  ] as const;

  return (
    <AdminShell email={admin.email}>
      <header className="admin-heading"><div><p className="eyebrow">Configuration</p><h1>Settings</h1></div></header>
      <section className="admin-grid">
        <article className="admin-card"><h2>Launch readiness</h2><ul className="check-list">{items.map(([label, ready, detail]) => <li key={label}>{ready ? <CheckCircle2 className="ready" /> : <CircleDashed />}<div><strong>{label}</strong><span>{detail}</span></div><b>{ready ? "Configured" : "Required"}</b></li>)}</ul><p className="muted">Secret values are never displayed here.</p></article>
        <article className="admin-card"><h2>Initial market focus</h2><dl className="detail-list"><div><dt>Primary location</dt><dd>Chicago, Illinois</dd></div><div><dt>Primary industries</dt><dd>Local construction companies, independent insurance agencies, and boutique marketing firms</dd></div><div><dt>Service radius</dt><dd>Chicago metro first; expand after validating demand</dd></div></dl></article>
        <article className="admin-card"><h2>Outreach policy</h2><p>Draft preparation and manual contact logging only. No email-send integration, sequences, bulk outreach, or automatic delivery exist in Phase One.</p></article>
        <article className="admin-card"><h2>Analytics policy</h2><p>First-party aggregate events, 90-day maximum reporting window, Global Privacy Control and Do Not Track honored, and no session replay or identity profiles.</p></article>
      </section>
    </AdminShell>
  );
}
