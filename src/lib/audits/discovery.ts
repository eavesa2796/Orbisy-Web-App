import "server-only";

import { load } from "cheerio";
import { getDomain } from "tldts";
import { parsePublicHttpUrl } from "@/lib/preflight/network";

const blockedPath = /\/(?:admin|login|sign[-_]?in|account|checkout|cart|wp-admin)(?:\/|$)/i;
const useful = [
  { type: "contact", pattern: /contact|get in touch/i, weight: 5 },
  { type: "services", pattern: /services|what we do|solutions/i, weight: 4 },
  { type: "about", pattern: /about|our team|who we are/i, weight: 3 },
  { type: "booking", pattern: /book|schedule|consultation|appointment/i, weight: 2 },
] as const;

export function registrableDomain(url: URL) {
  return getDomain(url.hostname, { allowPrivateDomains: false }) || url.hostname.toLowerCase();
}

export function assertSameRegistrableDomain(candidate: URL, allowedDomain: string) {
  if (registrableDomain(candidate) !== allowedDomain) throw new Error("cross_domain_destination");
}

export function robotsAllowsPath(body: string, path: string, userAgent = "orbisyaudit") {
  const groups: Array<{ agents: string[]; rules: Array<{ allow: boolean; path: string }> }> = [];
  let group: (typeof groups)[number] | null = null;
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim(); if (!line) continue;
    const separator = line.indexOf(":"); if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase(); const value = line.slice(separator + 1).trim();
    if (key === "user-agent") {
      if (!group || group.rules.length) { group = { agents: [], rules: [] }; groups.push(group); }
      group.agents.push(value.toLowerCase());
    } else if ((key === "allow" || key === "disallow") && group && value) {
      group.rules.push({ allow: key === "allow", path: value });
    }
  }
  const applicable = groups.filter((item) => item.agents.some((agent) => agent === "*" || userAgent.toLowerCase().includes(agent)));
  const matches = applicable.flatMap((item) => item.rules).filter((rule) => {
    const anchored = rule.path.endsWith("$"); const source = anchored ? rule.path.slice(0, -1) : rule.path;
    const escaped = source.slice(0, 500).replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*");
    return new RegExp(`^${escaped}${anchored ? "$" : ""}`).test(path);
  });
  matches.sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));
  return matches[0]?.allow ?? true;
}

export type DiscoveredPage = { url: string; pageType: string; selectionReason: string };

export function discoverUsefulPages(homepageUrl: string, html: string, maximumPages: number) {
  const base = parsePublicHttpUrl(homepageUrl); const domain = registrableDomain(base);
  const $ = load(html); const candidates = new Map<string, DiscoveredPage & { weight: number }>();
  $("a[href]").each((_index, element) => {
    const href = $(element).attr("href"); if (!href) return;
    let url: URL; try { url = parsePublicHttpUrl(new URL(href, base).toString()); } catch { return; }
    if (registrableDomain(url) !== domain || blockedPath.test(url.pathname)) return;
    url.hash = ""; const label = `${$(element).text()} ${url.pathname}`.trim();
    const match = useful.find((item) => item.pattern.test(label)); if (!match) return;
    const normalized = url.toString(); const existing = candidates.get(normalized);
    if (!existing || match.weight > existing.weight) candidates.set(normalized, {
      url: normalized, pageType: match.type,
      selectionReason: `Selected from a same-domain ${match.type} link on the homepage.`, weight: match.weight,
    });
  });
  return [...candidates.values()].sort((a, b) => b.weight - a.weight || a.url.localeCompare(b.url))
    .slice(0, Math.max(0, maximumPages - 1))
    .map((page) => ({ url: page.url, pageType: page.pageType, selectionReason: page.selectionReason }));
}

export function discoverInternalLinks(homepageUrl: string, html: string, maximumLinks: number) {
  const base = parsePublicHttpUrl(homepageUrl); const domain = registrableDomain(base); const $ = load(html);
  const links = new Set<string>();
  $("a[href]").each((_index, element) => {
    if (links.size >= maximumLinks) return;
    const href = $(element).attr("href"); if (!href) return;
    try {
      const url = parsePublicHttpUrl(new URL(href, base).toString()); url.hash = "";
      if (registrableDomain(url) === domain && !blockedPath.test(url.pathname)) links.add(url.toString());
    } catch {}
  });
  return [...links];
}
