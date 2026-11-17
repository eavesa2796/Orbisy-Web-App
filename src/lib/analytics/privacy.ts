export const ANALYTICS_OPTOUT_KEY = "orbisy_analytics_opt_out";
export const ANALYTICS_CHOICE_EVENT = "orbisy-analytics-choice";
export function browserPrivacyBlocked() {
  if (typeof window === "undefined") return true;
  try {
    return (
      window.localStorage.getItem(ANALYTICS_OPTOUT_KEY) === "true" ||
      navigator.doNotTrack === "1" ||
      Boolean(
        (navigator as Navigator & { globalPrivacyControl?: boolean })
          .globalPrivacyControl,
      )
    );
  } catch {
    return true;
  }
}
// Only known public pages can be sent to Google. Never send arbitrary pathname segments.
const publicPages: Record<string, string> = {
  "/": "Home",
  "/services": "Services",
  "/associations": "For associations",
  "/association-websites": "Association websites",
  "/member-portals": "Member portals",
  "/integrations": "Integrations",
  "/ongoing-support": "Ongoing support",
  "/about": "About",
  "/work": "Our work",
  "/pricing": "Project pricing",
  "/privacy": "Privacy",
  "/terms": "Terms",
  "/knowledge-base": "Knowledge base",
};
export function publicAnalyticsPage(pathname: string) {
  const path = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  return Object.hasOwn(publicPages, path)
    ? { path, title: publicPages[path] }
    : undefined;
}
export function isPrivateAnalyticsPath(pathname: string) {
  return /^\/(admin-portal|api|auth|preview)(\/|$)/.test(pathname);
}
