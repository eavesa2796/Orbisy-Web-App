import "server-only";

import { load } from "cheerio";
import { parsePublicHttpUrl } from "@/lib/preflight/network";

export type PublicBusinessContact = { type: "email" | "phone"; value: string; sourceUrl: string };

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const formattedPhone = /(?<![\w-])(?:\+?1[ .-]*)?(?:\([2-9]\d{2}\)[ ]*|[2-9]\d{2}[ .-]+)[2-9]\d{2}[ .-]+\d{4}(?![\w-])/g;
const orgTypes = new Set(["Organization", "NGO", "Corporation", "LocalBusiness", "ProfessionalService", "GovernmentOrganization", "EducationalOrganization"]);
const unsupportedPage = /\/(?:login|sign[-_]?in|admin|account|checkout|cart|wp-admin|logout|register)(?:\/|$)|\.[a-z0-9]{2,5}$/i;

export function normalizePhone(value: string) {
  const [number, extension] = value.trim().split(/(?:;ext=|\s+(?:ext\.?|x)\s*)/i);
  if (!number || !/^[+\d(). -]+$/.test(number)) return null;
  const digits = number.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) return null;
  return `+1${digits}${extension && /^\d{1,8}$/.test(extension) ? `;ext=${extension}` : ""}`;
}

export function normalizeEmail(value: string) {
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)
    && !/\.(png|jpg|jpeg|gif|svg|webp)$|^(?:no[-_.]?reply|do[-_.]?not[-_.]?reply)@|@(?:example\.(?:com|net|org)|sentry\.io)$/i.test(email)
    ? email : null;
}

export function extractPublicContacts(html: string, sourceUrl: string, chapterOnly = false): PublicBusinessContact[] {
  const $ = load(html);
  const contacts = new Map<string, PublicBusinessContact>();
  const add = (type: PublicBusinessContact["type"], value: unknown) => {
    if (typeof value !== "string") return;
    const normalized = type === "email" ? normalizeEmail(value) : normalizePhone(value);
    if (normalized) contacts.set(`${type}:${normalized}`, { type, value: normalized, sourceUrl });
  };

  const region = chapterOnly ? $("main,[role='main']").first().clone() : $("body").clone();
  region.find("script,style,noscript,svg,[hidden],[aria-hidden='true']").remove();
  if (chapterOnly) region.find("footer,header,nav,aside").remove();

  region.find("a[href]").each((_index, element) => {
    const href = $(element).attr("href") || "";
    if (/^mailto:/i.test(href)) add("email", href.slice(7).split("?")[0]);
    if (/^tel:/i.test(href) && !/\bfax\b/i.test($(element).text())) add("phone", href.slice(4));
  });

  // Preserve line boundaries so a fax label does not affect the phone above it.
  region.find("br").replaceWith("\n");
  region.find("p,div,li,address,td").append("\n");
  for (const line of region.text().slice(0, 200_000).split(/\n/)) {
    for (const [email] of line.matchAll(emailPattern)) add("email", email);
    for (const match of line.matchAll(formattedPhone)) {
      const prefix = line.slice(Math.max(0, match.index - 22), match.index);
      if (!/\b(?:fax|facsimile)\s*[:. -]*$/i.test(prefix)) add("phone", match[0]);
    }
  }

  if (!chapterOnly) {
    $("script[type='application/ld+json']").slice(0, 12).each((_index, element) => {
      const json = $(element).text();
      if (!json || json.length > 50_000) return;
      let data: unknown;
      try { data = JSON.parse(json); } catch { return; }
      const items = Array.isArray(data) ? data : [data];
      for (const outer of items.slice(0, 30)) {
        if (!outer || typeof outer !== "object") continue;
        const graph = ("@graph" in outer && Array.isArray(outer["@graph"])) ? outer["@graph"] : [outer];
        for (const entity of graph.slice(0, 30)) {
          if (!entity || typeof entity !== "object") continue;
          const types = Array.isArray(entity["@type"]) ? entity["@type"] : [entity["@type"]];
          if (!types.some((type: unknown) => typeof type === "string" && orgTypes.has(type))) continue;
          add("phone", entity.telephone);
          add("email", entity.email);
          const points = Array.isArray(entity.contactPoint) ? entity.contactPoint : [entity.contactPoint];
          for (const point of points.slice(0, 10)) {
            if (!point || typeof point !== "object") continue;
            add("phone", point.telephone);
            add("email", point.email);
          }
        }
      }
    });
  }

  return mergePublicContacts([...contacts.values()]);
}

export function mergePublicContacts(...sources: PublicBusinessContact[][]) {
  const unique = new Map<string, PublicBusinessContact>();
  for (const contact of sources.flat()) {
    const key = `${contact.type}:${contact.value}`;
    if (!unique.has(key)) unique.set(key, contact);
  }
  const values = [...unique.values()];
  return [
    ...values.filter(({ type }) => type === "phone").slice(0, 5),
    ...values.filter(({ type }) => type === "email").sort((a, b) =>
      Number(/^(?:info|office|contact|hello|admin|membership)@/.test(b.value))
      - Number(/^(?:info|office|contact|hello|admin|membership)@/.test(a.value))).slice(0, 10),
  ];
}

export function sameContactHost(left: URL, right: URL) {
  return left.hostname.replace(/^www\./, "") === right.hostname.replace(/^www\./, "")
    && left.protocol === right.protocol && left.port === right.port;
}

export function discoverBusinessContactPages(html: string, sourceUrl: string) {
  const $ = load(html);
  const base = new URL(sourceUrl);
  const urls = new Set<string>();
  $("a[href]").each((_index, element) => {
    if (urls.size >= 2) return false;
    const link = $(element);
    let url: URL;
    try { url = parsePublicHttpUrl(new URL(link.attr("href") || "", base).href); } catch { return; }
    if (!sameContactHost(url, base) || url.pathname === base.pathname || unsupportedPage.test(url.pathname)) return;
    if (!/(?:\bcontact(?: us)?\b|\bget in touch\b)/i.test(`${link.text()} ${url.pathname.replaceAll("-", " ")}`)) return;
    url.hash = "";
    // Follow the public path without tracking parameters.
    url.search = "";
    urls.add(url.href);
  });
  return [...urls];
}
