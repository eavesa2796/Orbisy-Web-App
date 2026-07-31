import type {
  BusinessDataAdapter,
  CandidateBusiness,
  ColumnMapping,
} from "@/lib/imports/types";
import { normalizeCsvRow } from "@/lib/imports/csv";
import { normalizeSourceIdentifier } from "@/lib/imports/normalization";

export class CsvBusinessAdapter
  implements BusinessDataAdapter<Record<string, string>>
{
  readonly providerName = "CSV";

  constructor(
    private readonly mapping: ColumnMapping,
    private readonly fallbackSourceName: string,
  ) {}

  validate(raw: Record<string, string>) {
    return normalizeCsvRow(raw, this.mapping, 2, this.fallbackSourceName)
      .validationErrors;
  }

  normalize(
    raw: Record<string, string>,
    rowNumber: number,
  ): CandidateBusiness {
    return normalizeCsvRow(
      raw,
      this.mapping,
      rowNumber,
      this.fallbackSourceName,
    );
  }

  sourceIdentifier(raw: Record<string, string>) {
    const header = this.mapping.sourceIdentifier;
    return header ? normalizeSourceIdentifier(raw[header]) : undefined;
  }
}

export class ManualBusinessAdapter
  implements BusinessDataAdapter<CandidateBusiness>
{
  readonly providerName = "Manual entry";
  validate(raw: CandidateBusiness) {
    return raw.validationErrors;
  }
  normalize(raw: CandidateBusiness) {
    return raw;
  }
  sourceIdentifier(raw: CandidateBusiness) {
    return raw.sourceIdentifier;
  }
}
