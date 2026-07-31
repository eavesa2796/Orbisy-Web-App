const stateMap: Record<string, string> = {
  illinois: "IL",
  indiana: "IN",
  wisconsin: "WI",
  michigan: "MI",
  california: "CA",
  "new york": "NY",
  texas: "TX",
  florida: "FL",
};

export function cleanText(value: unknown) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  return text || undefined;
}

export function normalizeBusinessName(value: unknown) {
  const name = cleanText(value)?.toLocaleLowerCase("en-US");
  if (!name) return undefined;
  return name
    .replace(/[.,]/g, "")
    .replace(/\b(incorporated|inc|limited|ltd|llc|l\.l\.c|corporation|corp)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeEmail(value: unknown) {
  const email = cleanText(value)?.toLowerCase();
  if (!email) return undefined;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
}

export function normalizePhone(value: unknown) {
  const digits = cleanText(value)?.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : undefined;
}

export function normalizeState(value: unknown) {
  const state = cleanText(value);
  if (!state) return undefined;
  if (/^[a-z]{2}$/i.test(state)) return state.toUpperCase();
  return stateMap[state.toLowerCase()] ?? state;
}

export function normalizePostalCode(value: unknown) {
  const postalCode = cleanText(value)?.toUpperCase();
  if (!postalCode) return undefined;
  const usMatch = postalCode.match(/^(\d{5})(?:-?(\d{4}))?$/);
  if (!usMatch) return postalCode;
  return usMatch[2] ? `${usMatch[1]}-${usMatch[2]}` : usMatch[1];
}

export function normalizeWebsite(value: unknown): {
  websiteUrl?: string;
  normalizedDomain?: string;
  valid: boolean;
} {
  const raw = cleanText(value);
  if (!raw) return { valid: true };
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!["http:", "https:"].includes(url.protocol)) return { valid: false };
    url.hash = "";
    const normalizedDomain = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!normalizedDomain.includes(".")) return { valid: false };
    const path = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
    return {
      websiteUrl: `${url.protocol}//${url.host}${path}${url.search}`,
      normalizedDomain,
      valid: true,
    };
  } catch {
    return { valid: false };
  }
}

export function normalizeSourceIdentifier(value: unknown) {
  return cleanText(value)?.toLowerCase();
}

export function parseDiscoveredDate(value: unknown) {
  const text = cleanText(value);
  if (!text) return undefined;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
