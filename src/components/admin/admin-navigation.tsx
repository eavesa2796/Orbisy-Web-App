"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import {
  adminNavigationGroups,
  isAdminDestinationActive,
} from "@/lib/admin-navigation";
const icons = {
  overview: LayoutDashboard,
  clients: BriefcaseBusiness,
  leads: UsersRound,
  pricing: DollarSign,
  notifications: Bell,
  tools: Wrench,
  imports: FileUp,
  preflight: FileSearch,
  audits: ScanSearch,
  suppressions: ShieldBan,
  analytics: BarChart3,
  settings: Settings,
};
export function AdminNavigation({
  reviewMode = false,
  reviewView,
}: {
  reviewMode?: boolean;
  reviewView?: string;
}) {
  const pathname = usePathname();
  return (
    <NavigationContent
      key={`${pathname}:${reviewView ?? ""}`}
      pathname={pathname}
      reviewMode={reviewMode}
      reviewView={reviewView}
    />
  );
}
function NavigationContent({
  pathname,
  reviewMode,
  reviewView,
}: {
  pathname: string;
  reviewMode: boolean;
  reviewView?: string;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const reviewLinks = [
    {
      href: "/preview/workspace",
      label: "Dashboard preview",
      icon: "overview" as const,
      active: !reviewView,
    },
    {
      href: "/preview/workspace?view=client",
      label: "Client preview",
      icon: "clients" as const,
      active: reviewView === "client" || reviewView === "edit",
    },
    {
      href: "/preview/workspace?view=discovery",
      label: "Discovery preview",
      icon: "preflight" as const,
      active: reviewView === "discovery",
    },
  ];
  const link = (
    item: { href: string; label: string; icon: keyof typeof icons },
    active: boolean,
  ) => {
    const Icon = icons[item.icon];
    return (
      <Link
        href={item.href}
        key={item.href}
        aria-current={active ? "page" : undefined}
        onClick={() => setOpen(false)}
      >
        <Icon size={17} aria-hidden="true" />
        {item.label}
      </Link>
    );
  };
  return (
    <div
      className="admin-navigation"
      data-open={open}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="admin-menu-toggle"
        aria-controls="admin-navigation-panel"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (
          <X size={19} aria-hidden="true" />
        ) : (
          <Menu size={19} aria-hidden="true" />
        )}
        {open ? "Close menu" : "Menu"}
      </button>
      <nav id="admin-navigation-panel" aria-label="Administrator navigation">
        {reviewMode ? (
          <>
            <span className="admin-nav-label">Design review</span>
            {reviewLinks.map((item) => link(item, item.active))}
          </>
        ) : (
          <>
            <div className="admin-nav-primary">
              <span className="admin-nav-label">Client work</span>
              {adminNavigationGroups[0].links.map((item) =>
                link(item, isAdminDestinationActive(pathname, item.href)),
              )}
            </div>
            <details
              className="admin-supporting-nav"
              open={adminNavigationGroups[1].links.some((item) =>
                isAdminDestinationActive(pathname, item.href),
              )}
            >
              <summary>
                Supporting tools
                <ChevronDown size={15} aria-hidden="true" />
              </summary>
              <div>
                {adminNavigationGroups[1].links.map((item) =>
                  link(item, isAdminDestinationActive(pathname, item.href)),
                )}
              </div>
            </details>
          </>
        )}
      </nav>
    </div>
  );
}
