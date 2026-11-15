import { CheckCircle2, CircleDashed } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { hasDatabaseConfig, hasSupabaseConfig } from "@/lib/config";
import { getImportSettings } from "@/lib/imports/service";
import { OperatingSettingsForm } from "@/components/admin/operating-settings-form";
import { ToolGuide } from "@/components/admin/tool-guide";

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const settings = await getImportSettings();
  const items = [
    [
      "PostgreSQL",
      hasDatabaseConfig(),
      "Required for forms, leads, and analytics",
    ],
    [
      "Supabase authentication",
      hasSupabaseConfig(),
      "Required for administrator sign-in",
    ],
    [
      "Administrator allowlist",
      Boolean(process.env.ADMIN_EMAIL),
      "Must match the sole Supabase administrator",
    ],
    [
      "Turnstile spam protection",
      Boolean(process.env.TURNSTILE_SECRET_KEY),
      "Needed for protected public forms",
    ],
    [
      "Inbound notifications",
      Boolean(process.env.RESEND_API_KEY),
      "Optional; form storage works without email",
    ],
    [
      "Preflight worker secret",
      Boolean(process.env.PREFLIGHT_WORKER_SECRET),
      "Only needed for the optional preflight worker",
    ],
    [
      "Deep-audit worker secret",
      Boolean(process.env.DEEP_AUDIT_WORKER_SECRET),
      "Only needed for the optional website-audit worker",
    ],
    [
      "PageSpeed",
      Boolean(process.env.PAGESPEED_API_KEY),
      "Optional; unavailable checks do not count as failures",
    ],
  ] as const;

  return (
    <AdminShell email={admin.email}>
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Configuration</p>
          <h1>Settings</h1>
        </div>
      </header>
      <ToolGuide tool="settings" />
      <section className="admin-grid">
        <article className="admin-card">
          <h2>Configuration presence</h2>
          <ul className="check-list">
            {items.map(([label, ready, detail]) => (
              <li key={label}>
                {ready ? <CheckCircle2 className="ready" /> : <CircleDashed />}
                <div>
                  <strong>{label}</strong>
                  <span>{detail}</span>
                </div>
                <b>{ready ? "Present" : "Not configured"}</b>
              </li>
            ))}
          </ul>
          <p className="muted">
            This checks whether configuration values exist, not whether a
            connection or delivery works. Optional research services are not
            required for inquiry storage or client workspaces. Secret values are
            never displayed here.
          </p>
        </article>
        <article className="admin-card">
          <h2>Saved prospecting targets</h2>
          <dl className="detail-list">
            <div>
              <dt>Locations</dt>
              <dd>{settings.targetLocations.join(", ")}</dd>
            </div>
            <div>
              <dt>Industries</dt>
              <dd>{settings.targetIndustries.join(", ")}</dd>
            </div>
          </dl>
        </article>
        <article className="admin-card">
          <h2>Outreach policy</h2>
          <p>
            Draft preparation and manual contact logging only. These prospecting
            tools do not send outreach, run sequences, or deliver messages
            automatically. Inquiry email alerts are a separate workflow.
          </p>
        </article>
        <article className="admin-card">
          <h2>Analytics policy</h2>
          <p>
            First-party aggregate events, 90-day maximum reporting window,
            Global Privacy Control and Do Not Track honored, and no session
            replay or identity profiles.
          </p>
        </article>
      </section>
      <section className="admin-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">Stored in PostgreSQL</p>
            <h2>Operating controls</h2>
          </div>
        </div>
        <OperatingSettingsForm settings={settings} />
      </section>
    </AdminShell>
  );
}
