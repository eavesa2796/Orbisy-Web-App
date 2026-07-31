export const importFieldNames = [
  "businessName",
  "category",
  "industry",
  "address",
  "city",
  "state",
  "postalCode",
  "location",
  "websiteUrl",
  "email",
  "phone",
  "contactName",
  "sourceName",
  "sourceUrl",
  "sourceIdentifier",
  "dateDiscovered",
] as const;

export type ImportFieldName = (typeof importFieldNames)[number];
export type ColumnMapping = Partial<Record<ImportFieldName, string>>;

export type CandidateBusiness = {
  originalRowNumber: number;
  originalData: Record<string, string>;
  businessName?: string;
  normalizedBusinessName?: string;
  category?: string;
  industry?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  location?: string;
  websiteUrl?: string;
  websiteState: "unknown" | "provided" | "not_listed";
  normalizedDomain?: string;
  email?: string;
  normalizedEmail?: string;
  phone?: string;
  normalizedPhone?: string;
  contactName?: string;
  sourceName: string;
  sourceUrl?: string;
  sourceIdentifier?: string;
  dateDiscovered?: Date;
  validationErrors: string[];
  validationWarnings: string[];
};

export interface BusinessDataAdapter<TRaw> {
  readonly providerName: string;
  validate(raw: TRaw): string[];
  normalize(raw: TRaw, rowNumber: number): CandidateBusiness;
  sourceIdentifier(raw: TRaw): string | undefined;
}
