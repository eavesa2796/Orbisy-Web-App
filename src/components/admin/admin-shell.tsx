import Link from "next/link";
import { BarChart3, FileSearch, FileUp, LayoutDashboard, ScanSearch, Settings, ShieldBan, UsersRound } from "lucide-react";
import { LogoutButton } from "@/components/admin/logout-button";

const links = [
  ["/admin-portal/dashboard", LayoutDashboard, "Overview"],
  ["/admin-portal/leads", UsersRound, "Leads"],
  ["/admin-portal/imports", FileUp, "Imports"],
  ["/admin-portal/preflight", FileSearch, "Preflight"],
  ["/admin-portal/audits", ScanSearch, "Audits"],
  ["/admin-portal/suppressions", ShieldBan, "Suppressions"],
  ["/admin-portal/analytics", BarChart3, "Analytics"],
  ["/admin-portal/settings", Settings, "Settings"],
] as const;

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <Link className="wordmark" href="/admin-portal/dashboard">
          <span className="wordmark-orbit" /> Orbisy
        </Link>
        <nav aria-label="Administrator navigation">
          {links.map(([href, Icon, label]) => (
            <Link href={href} key={href}><Icon size={17} />{label}</Link>
          ))}
        </nav>
        <div className="admin-account">
          <span>Signed in as</span>
          <strong>{email}</strong>
          <LogoutButton />
        </div>
      </aside>
      <main className="admin-main" id="main-content">{children}</main>
    </div>
  );
}
