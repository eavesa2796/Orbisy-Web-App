import Link from "next/link";
import {
  DollarSign,
  Bell,
  BarChart3,
  FileSearch,
  FileUp,
  LayoutDashboard,
  ScanSearch,
  Settings,
  ShieldBan,
  UsersRound,
  BriefcaseBusiness,
  Wrench,
} from "lucide-react";
import { LogoutButton } from "@/components/admin/logout-button";
import { OrbisyLogo } from "@/components/orbisy-logo";

const links = [
  ["/admin-portal/dashboard", LayoutDashboard, "Overview"],
  ["/admin-portal/clients", BriefcaseBusiness, "Clients"],
  ["/admin-portal/leads", UsersRound, "Inquiries & leads"],
  ["/admin-portal/pricing", DollarSign, "Pricing"],
  ["/admin-portal/notifications", Bell, "Notifications"],
  ["/admin-portal/tools", Wrench, "Prospecting overview"],
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
  reviewMode = false,
}: {
  email: string;
  children: React.ReactNode;
  reviewMode?: boolean;
}) {
  const shownLinks = reviewMode
    ? ([
        ["/preview/workspace", LayoutDashboard, "Dashboard preview"],
        ["/preview/workspace?view=client", BriefcaseBusiness, "Client preview"],
        ["/preview/workspace?view=discovery", FileSearch, "Discovery preview"],
      ] as const)
    : links;
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <Link
          className="admin-brand"
          href={reviewMode ? "/preview/workspace" : "/admin-portal/dashboard"}
          aria-label="Orbisy administrator overview"
        >
          <OrbisyLogo className="admin-brand-logo" priority />
        </Link>
        <nav aria-label="Administrator navigation">
          <span className="admin-nav-label">Client work</span>
          {shownLinks.map(([href, Icon, label], index) => (
            <div key={href} className="admin-nav-item">
              {!reviewMode && index === 5 && (
                <span className="admin-nav-label">Supporting tools</span>
              )}
              <Link href={href} key={href}>
                <Icon size={17} aria-hidden="true" />
                {label}
              </Link>
            </div>
          ))}
        </nav>
        <div className="admin-account">
          <span>{reviewMode ? "Read-only design review" : "Signed in as"}</span>
          <strong>{reviewMode ? "Fictional example data" : email}</strong>
          {!reviewMode && <LogoutButton />}
        </div>
      </aside>
      <main className="admin-main" id="main-content">
        {children}
      </main>
    </div>
  );
}
