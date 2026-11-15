import Link from "next/link";
import { LogoutButton } from "@/components/admin/logout-button";
import { OrbisyLogo } from "@/components/orbisy-logo";
import { AdminNavigation } from "@/components/admin/admin-navigation";

export function AdminShell({
  email,
  children,
  reviewMode = false,
  reviewView,
}: {
  email: string;
  children: React.ReactNode;
  reviewMode?: boolean;
  reviewView?: string;
}) {
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
        <AdminNavigation reviewMode={reviewMode} reviewView={reviewView} />
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
