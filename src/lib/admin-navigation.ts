export const adminNavigationGroups = [
  {
    label: "Client work",
    links: [
      { href: "/admin-portal/dashboard", label: "Overview", icon: "overview" },
      { href: "/admin-portal/clients", label: "Clients", icon: "clients" },
      {
        href: "/admin-portal/leads",
        label: "Inquiries & leads",
        icon: "leads",
      },
      { href: "/admin-portal/pricing", label: "Pricing", icon: "pricing" },
      {
        href: "/admin-portal/notifications",
        label: "Notifications",
        icon: "notifications",
      },
    ],
  },
  {
    label: "Supporting tools",
    links: [
      {
        href: "/admin-portal/tools",
        label: "Tools & guide",
        icon: "tools",
      },
      { href: "/admin-portal/imports", label: "Imports", icon: "imports" },
      {
        href: "/admin-portal/preflight",
        label: "Website checks",
        icon: "preflight",
      },
      { href: "/admin-portal/audits", label: "Website audits", icon: "audits" },
      {
        href: "/admin-portal/suppressions",
        label: "Do-not-contact",
        icon: "suppressions",
      },
      {
        href: "/admin-portal/analytics",
        label: "Website analytics",
        icon: "analytics",
      },
      { href: "/admin-portal/settings", label: "Settings", icon: "settings" },
    ],
  },
] as const;
export function isAdminDestinationActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}
