import { parse } from "csv-parse/sync";
import type {
  CandidateBusiness,
  ColumnMapping,
  ImportFieldName,
} from "@/lib/imports/types";
import {
  cleanText,
  normalizeBusinessName,
  normalizeEmail,
  normalizePhone,
  normalizePostalCode,
  normalizeSourceIdentifier,
  normalizeState,
  normalizeWebsite,
  parseDiscoveredDate,
} from "@/lib/imports/normalization";

export const CSV_LIMITS = { maxBytes: 1_000_000, maxRows: 500 } as const;

export function parseCsvText(
  text: string,
  maxRows: number = CSV_LIMITS.maxRows,
) {
  if (text.includes("\0")) throw new Error("CSV contains unsupported null bytes.");
  const records = parse(text.replace(/^\uFEFF/, ""), {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    relax_column_count: false,
    trim: true,
    max_record_size: 20_000,
  }) as Record<string, string>[];
  if (records.length > maxRows) {
    throw new Error(`CSV exceeds the ${maxRows}-row limit.`);
  }
  return records;
}

function mapped(row: Record<string, string>, mapping: ColumnMapping, field: ImportFieldName) {
  const header = mapping[field];
  return header ? row[header] : undefined;
}

export function normalizeCsvRow(
  row: Record<string, string>,
  mapping: ColumnMapping,
  rowNumber: number,
  fallbackSourceName: string,
): CandidateBusiness {
  const errors: string[] = [];
  const warnings: string[] = [];
  const businessName = cleanText(mapped(row, mapping, "businessName"));
  const sourceName =
    cleanText(mapped(row, mapping, "sourceName")) ?? fallbackSourceName;
  const emailRaw = cleanText(mapped(row, mapping, "email"));
  const phoneRaw = cleanText(mapped(row, mapping, "phone"));
  const websiteRaw = cleanText(mapped(row, mapping, "websiteUrl"));
  const normalizedEmail = normalizeEmail(emailRaw);
  const normalizedPhone = normalizePhone(phoneRaw);
  const website = normalizeWebsite(websiteRaw);
  const dateRaw = cleanText(mapped(row, mapping, "dateDiscovered"));
  const dateDiscovered = parseDiscoveredDate(dateRaw);

  if (!businessName) errors.push("Business name is required.");
  if (!sourceName) errors.push("Source name is required.");
  if (emailRaw && !normalizedEmail) errors.push("Public email is invalid.");
  if (phoneRaw && !normalizedPhone) errors.push("Public phone is invalid.");
  if (websiteRaw && !website.valid) errors.push("Website URL is invalid.");
  if (dateRaw && !dateDiscovered) errors.push("Date discovered is invalid.");
  if (!websiteRaw) warnings.push("No website was listed by the source.");

  return {
    originalRowNumber: rowNumber,
    originalData: Object.fromEntries(
      [...new Set(Object.values(mapping).filter(Boolean))].map((header) => [
        header,
        String(row[header] ?? "").slice(0, 2_000),
      ]),
    ),
    businessName,
    normalizedBusinessName: normalizeBusinessName(businessName),
    category: cleanText(mapped(row, mapping, "category")),
    industry: cleanText(mapped(row, mapping, "industry")),
    address: cleanText(mapped(row, mapping, "address")),
    city: cleanText(mapped(row, mapping, "city")),
    state: normalizeState(mapped(row, mapping, "state")),
    postalCode: normalizePostalCode(mapped(row, mapping, "postalCode")),
    location: cleanText(mapped(row, mapping, "location")),
    websiteUrl: website.websiteUrl,
    websiteState: websiteRaw ? "provided" : "not_listed",
    normalizedDomain: website.normalizedDomain,
    email: emailRaw,
    normalizedEmail,
    phone: phoneRaw,
    normalizedPhone,
    contactName: cleanText(mapped(row, mapping, "contactName")),
    sourceName,
    sourceUrl: normalizeWebsite(mapped(row, mapping, "sourceUrl")).websiteUrl,
    sourceIdentifier: normalizeSourceIdentifier(
      mapped(row, mapping, "sourceIdentifier"),
    ),
    dateDiscovered,
    validationErrors: errors,
    validationWarnings: warnings,
  };
}

export function escapeCsvFormula(value: unknown) {
  const text = String(value ?? "");
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

export function encodeCsvCell(value: unknown) {
  const escaped = escapeCsvFormula(value).replaceAll('"', '""');
  return `"${escaped}"`;
}
