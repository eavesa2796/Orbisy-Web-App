import "server-only";
import {
  and,
  desc,
  eq,
  inArray,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  adminActivityLogs,
  appSettings,
  businessSourceRecords,
  importBatches,
  importCandidates,
  leads,
  suppressionEntries,
} from "@/lib/db/schema";
import { CsvBusinessAdapter } from "@/lib/imports/adapters";
import { encodeCsvCell, parseCsvText } from "@/lib/imports/csv";
import { normalizeBusinessName } from "@/lib/imports/normalization";
import { canConfirmBatch, matchesSuppression } from "@/lib/imports/policy";
import type {
  CandidateBusiness,
  ColumnMapping,
} from "@/lib/imports/types";

export async function getImportSettings() {
  const db = getDb();
  const [settings] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.id, "default"))
    .limit(1);
  return (
    settings ?? {
      id: "default",
      targetIndustries: [
        "Local construction companies",
        "Independent insurance agencies",
        "Boutique marketing firms",
      ],
      targetLocations: ["Chicago, Illinois", "Chicago metropolitan area"],
      maxCsvBytes: 1_000_000,
      maxRowsPerBatch: 500,
      defaultSourceName: "Permitted CSV import",
      likelyDuplicateThreshold: 90,
      possibleDuplicateThreshold: 70,
      possibleDuplicatesRequireReview: true,
      missingWebsitesRequireReview: false,
      importRetentionDays: 365,
      defaultPageSize: 20,
      updatedAt: new Date(0),
    }
  );
}

type ClassifiedCandidate = CandidateBusiness & {
  duplicateClassification:
    | "new_record"
    | "exact_duplicate"
    | "likely_duplicate"
    | "possible_duplicate"
    | "existing_suppressed"
    | "requires_manual_review";
  duplicateReasons: string[];
  matchedLeadId?: string;
  suppressionEntryId?: string;
  status:
    | "ready"
    | "invalid"
    | "needs_review"
    | "suppressed"
    | "duplicate";
};

function key(value?: string | null) {
  return value || undefined;
}

async function classifyCandidates(
  candidates: CandidateBusiness[],
  settings: {
    possibleDuplicatesRequireReview: boolean;
    missingWebsitesRequireReview: boolean;
  },
): Promise<ClassifiedCandidate[]> {
  const db = getDb();
  const emails = [...new Set(candidates.map((item) => key(item.normalizedEmail)).filter(Boolean))] as string[];
  const domains = [...new Set(candidates.map((item) => key(item.normalizedDomain)).filter(Boolean))] as string[];
  const phones = [...new Set(candidates.map((item) => key(item.normalizedPhone)).filter(Boolean))] as string[];
  const sourceIds = [...new Set(candidates.map((item) => key(item.sourceIdentifier)).filter(Boolean))] as string[];
  const cities = [
    ...new Set(
      candidates
        .map((item) => key(item.city?.toLowerCase()))
        .filter(Boolean),
    ),
  ] as string[];

  const leadFilters = [
    emails.length
      ? or(
          inArray(leads.normalizedEmail, emails),
          sql`lower(${leads.email}) in (${sql.join(
            emails.map((email) => sql`${email}`),
            sql`, `,
          )})`,
        )
      : undefined,
    domains.length ? inArray(leads.normalizedDomain, domains) : undefined,
    phones.length ? inArray(leads.normalizedPhone, phones) : undefined,
    sourceIds.length ? inArray(leads.sourceIdentifier, sourceIds) : undefined,
    cities.length
      ? sql`lower(${leads.city}) in (${sql.join(
          cities.map((city) => sql`${city}`),
          sql`, `,
        )})`
      : undefined,
  ].filter(Boolean);
  const suppressionFilters = [
    emails.length ? inArray(suppressionEntries.normalizedEmail, emails) : undefined,
    domains.length ? inArray(suppressionEntries.normalizedDomain, domains) : undefined,
    phones.length ? inArray(suppressionEntries.normalizedPhone, phones) : undefined,
    sourceIds.length
      ? inArray(suppressionEntries.normalizedSourceIdentifier, sourceIds)
      : undefined,
  ].filter(Boolean);

  const [existingLeads, suppressions] = await Promise.all([
    leadFilters.length
      ? db.select().from(leads).where(or(...leadFilters))
      : Promise.resolve([]),
    suppressionFilters.length
      ? db
          .select()
          .from(suppressionEntries)
          .where(or(...suppressionFilters))
      : Promise.resolve([]),
  ]);

  const seen = new Map<string, number>();
  return candidates.map((candidate) => {
    if (candidate.validationErrors.length) {
      return {
        ...candidate,
        duplicateClassification: "requires_manual_review",
        duplicateReasons: [],
        status: "invalid",
      };
    }

    const suppression = suppressions.find((entry) =>
      matchesSuppression(candidate, entry),
    );
    if (suppression) {
      return {
        ...candidate,
        duplicateClassification: "existing_suppressed",
        duplicateReasons: ["Candidate matches an existing suppression entry."],
        suppressionEntryId: suppression.id,
        status: "suppressed",
      };
    }

    const exact = existingLeads.find(
      (lead) =>
        (candidate.sourceIdentifier &&
          lead.sourceIdentifier === candidate.sourceIdentifier) ||
        (candidate.normalizedDomain &&
          lead.normalizedDomain === candidate.normalizedDomain) ||
        (candidate.normalizedEmail &&
          (lead.normalizedEmail === candidate.normalizedEmail ||
            lead.email?.toLowerCase() === candidate.normalizedEmail)) ||
        (candidate.normalizedPhone &&
          lead.normalizedPhone === candidate.normalizedPhone),
    );
    if (exact) {
      const reasons = [
        candidate.normalizedDomain === exact.normalizedDomain && "Same domain",
        candidate.normalizedEmail &&
          (candidate.normalizedEmail === exact.normalizedEmail ||
            candidate.normalizedEmail === exact.email?.toLowerCase()) &&
          "Same email",
        candidate.normalizedPhone === exact.normalizedPhone && "Same phone",
        candidate.sourceIdentifier === exact.sourceIdentifier &&
          "Same source identifier",
      ].filter(Boolean) as string[];
      return {
        ...candidate,
        duplicateClassification: "exact_duplicate",
        duplicateReasons: reasons,
        matchedLeadId: exact.id,
        status: "duplicate",
      };
    }

    const rowKey =
      candidate.normalizedDomain ||
      candidate.normalizedEmail ||
      candidate.normalizedPhone ||
      (candidate.normalizedBusinessName && candidate.city
        ? `${candidate.normalizedBusinessName}|${candidate.city.toLowerCase()}`
        : undefined);
    if (rowKey && seen.has(rowKey)) {
      return {
        ...candidate,
        duplicateClassification: "exact_duplicate",
        duplicateReasons: [
          `Duplicates row ${seen.get(rowKey)} within this import batch.`,
        ],
        status: "duplicate",
      };
    }
    if (rowKey) seen.set(rowKey, candidate.originalRowNumber);

    const likely = existingLeads.find(
      (lead) =>
        candidate.normalizedBusinessName &&
        normalizeBusinessName(lead.businessName) ===
          candidate.normalizedBusinessName &&
        candidate.state &&
        lead.state?.toLowerCase() === candidate.state.toLowerCase(),
    );
    if (likely) {
      return {
        ...candidate,
        duplicateClassification: "likely_duplicate",
        duplicateReasons: ["Same normalized business name and state."],
        matchedLeadId: likely.id,
        status: "needs_review",
      };
    }

    const possible = existingLeads.find(
      (lead) =>
        candidate.normalizedBusinessName &&
        (normalizeBusinessName(lead.businessName)?.includes(
          candidate.normalizedBusinessName,
        ) ||
          candidate.normalizedBusinessName.includes(
            normalizeBusinessName(lead.businessName) || "\u0000",
          )) &&
        candidate.city &&
        lead.city?.toLowerCase() === candidate.city.toLowerCase(),
    );
    if (possible) {
      return {
        ...candidate,
        duplicateClassification: "possible_duplicate",
        duplicateReasons: ["Similar business name in the same city."],
        matchedLeadId: possible.id,
        status: settings.possibleDuplicatesRequireReview
          ? "needs_review"
          : "ready",
      };
    }

    if (
      candidate.websiteState === "not_listed" &&
      settings.missingWebsitesRequireReview
    ) {
      return {
        ...candidate,
        duplicateClassification: "requires_manual_review",
        duplicateReasons: ["No website was listed by the source."],
        status: "needs_review",
      };
    }

    return {
      ...candidate,
      duplicateClassification: "new_record",
      duplicateReasons: [],
      status: "ready",
    };
  });
}

export async function createCsvImport(input: {
  filename: string;
  csvText: string;
  mapping: ColumnMapping;
  sourceName: string;
  sourceUrl?: string;
  administratorEmail: string;
}) {
  const settings = await getImportSettings();
  const rows = parseCsvText(input.csvText, settings.maxRowsPerBatch);
  if (!rows.length) throw new Error("CSV contains no data rows.");
  if (!input.mapping.businessName) {
    throw new Error("Map a CSV column to Business name.");
  }

  const adapter = new CsvBusinessAdapter(input.mapping, input.sourceName);
  const normalized = rows.map((row, index) => adapter.normalize(row, index + 2));
  const classified = await classifyCandidates(normalized, settings);
  const counts = {
    valid: classified.filter((item) => item.status !== "invalid").length,
    invalid: classified.filter((item) => item.status === "invalid").length,
    duplicate: classified.filter((item) => item.status === "duplicate").length,
    suppressed: classified.filter((item) => item.status === "suppressed").length,
  };

  const db = getDb();
  return db.transaction(async (tx) => {
    const [batch] = await tx
      .insert(importBatches)
      .values({
        originalFilename: input.filename,
        sourceName: input.sourceName,
        sourceUrl: input.sourceUrl,
        createdBy: input.administratorEmail,
        status: counts.invalid ? "completed_with_errors" : "ready",
        totalRows: classified.length,
        validRows: counts.valid,
        invalidRows: counts.invalid,
        duplicateRows: counts.duplicate,
        suppressedRows: counts.suppressed,
        errorSummary: counts.invalid
          ? `${counts.invalid} row(s) require correction.`
          : undefined,
      })
      .returning({ id: importBatches.id });

    if (classified.length) {
      await tx.insert(importCandidates).values(
        classified.map((candidate) => ({
          importBatchId: batch.id,
          ...candidate,
        })),
      );
    }
    await tx.insert(adminActivityLogs).values({
      adminEmail: input.administratorEmail,
      action: "import.preview_created",
      entityType: "import_batch",
      entityId: batch.id,
      metadata: { rowCount: classified.length },
    });
    return batch.id;
  });
}

export async function confirmImportBatch(
  batchId: string,
  administratorEmail: string,
) {
  const db = getDb();
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from import_batches where id = ${batchId} for update`,
    );
    const [batch] = await tx
      .select()
      .from(importBatches)
      .where(eq(importBatches.id, batchId))
      .limit(1);
    if (!batch) throw new Error("Import batch not found.");
    if (!canConfirmBatch(batch)) {
      return { imported: batch.importedRows, duplicate: true };
    }

    await tx
      .update(importBatches)
      .set({ status: "importing", confirmedAt: new Date() })
      .where(eq(importBatches.id, batchId));
    const candidates = await tx
      .select()
      .from(importCandidates)
      .where(
        and(
          eq(importCandidates.importBatchId, batchId),
          eq(importCandidates.status, "ready"),
        ),
      )
      .orderBy(importCandidates.originalRowNumber);

    let imported = 0;
    for (const candidate of candidates) {
      const [lead] = await tx
        .insert(leads)
        .values({
          businessName: candidate.businessName!,
          category: candidate.category,
          industry: candidate.industry,
          address: candidate.address,
          city: candidate.city,
          state: candidate.state,
          postalCode: candidate.postalCode,
          location: candidate.location,
          websiteUrl: candidate.websiteUrl,
          websiteState: candidate.websiteState,
          normalizedDomain: candidate.normalizedDomain,
          email: candidate.email,
          normalizedEmail: candidate.normalizedEmail,
          phone: candidate.phone,
          normalizedPhone: candidate.normalizedPhone,
          contactName: candidate.contactName,
          sourceName: candidate.sourceName,
          sourceUrl: candidate.sourceUrl,
          sourceIdentifier: candidate.sourceIdentifier,
          importBatchId: batchId,
          originalRowNumber: candidate.originalRowNumber,
          dateDiscovered: candidate.dateDiscovered,
          status: "needs_review",
          duplicateReviewStatus: "cleared",
          manualReviewStatus: "pending",
        })
        .returning({ id: leads.id });
      await tx.insert(businessSourceRecords).values({
        leadId: lead.id,
        candidateId: candidate.id,
        importBatchId: batchId,
        providerName: candidate.sourceName,
        sourceUrl: candidate.sourceUrl,
        sourceIdentifier: candidate.sourceIdentifier,
        originalRowNumber: candidate.originalRowNumber,
        minimizedSnapshot: candidate.originalData,
        discoveredAt: candidate.dateDiscovered,
      });
      await tx
        .update(importCandidates)
        .set({
          status: "imported",
          importedLeadId: lead.id,
          administratorDecision: "import_as_new",
          decidedBy: administratorEmail,
          decidedAt: new Date(),
        })
        .where(eq(importCandidates.id, candidate.id));
      imported += 1;
    }

    const remaining = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(importCandidates)
      .where(
        and(
          eq(importCandidates.importBatchId, batchId),
          eq(importCandidates.status, "needs_review"),
        ),
      );
    await tx
      .update(importBatches)
      .set({
        status: remaining[0]?.count ? "completed_with_errors" : "completed",
        importedRows: imported,
        completedAt: new Date(),
      })
      .where(eq(importBatches.id, batchId));
    await tx.insert(adminActivityLogs).values({
      adminEmail: administratorEmail,
      action: "import.confirmed",
      entityType: "import_batch",
      entityId: batchId,
      metadata: { imported },
    });
    return { imported, duplicate: false };
  });
}

export async function getImportBatches() {
  return getDb()
    .select()
    .from(importBatches)
    .orderBy(desc(importBatches.createdAt))
    .limit(50);
}

export async function getImportBatch(batchId: string) {
  const db = getDb();
  const [batch, candidates] = await Promise.all([
    db
      .select()
      .from(importBatches)
      .where(eq(importBatches.id, batchId))
      .limit(1),
    db
      .select()
      .from(importCandidates)
      .where(eq(importCandidates.importBatchId, batchId))
      .orderBy(importCandidates.originalRowNumber),
  ]);
  return { batch: batch[0] ?? null, candidates };
}

export async function getReviewCandidates() {
  return getDb()
    .select()
    .from(importCandidates)
    .where(eq(importCandidates.status, "needs_review"))
    .orderBy(desc(importCandidates.createdAt))
    .limit(100);
}

export async function decideImportCandidate(input: {
  candidateId: string;
  decision:
    | "skip"
    | "mark_duplicate"
    | "import_as_new"
    | "update_existing"
    | "suppress";
  administratorEmail: string;
  reason?: string;
}) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [candidate] = await tx
      .select()
      .from(importCandidates)
      .where(eq(importCandidates.id, input.candidateId))
      .limit(1);
    if (!candidate || !["needs_review", "ready"].includes(candidate.status)) {
      throw new Error("Candidate is no longer awaiting review.");
    }
    let status: "skipped" | "duplicate" | "suppressed" | "imported";
    let importedLeadId: string | undefined;
    if (input.decision === "import_as_new") {
      const result = await tx
        .insert(leads)
        .values({
          businessName: candidate.businessName!,
          category: candidate.category,
          industry: candidate.industry,
          address: candidate.address,
          city: candidate.city,
          state: candidate.state,
          postalCode: candidate.postalCode,
          location: candidate.location,
          websiteUrl: candidate.websiteUrl,
          websiteState: candidate.websiteState,
          normalizedDomain: candidate.normalizedDomain,
          email: candidate.email,
          normalizedEmail: candidate.normalizedEmail,
          phone: candidate.phone,
          normalizedPhone: candidate.normalizedPhone,
          contactName: candidate.contactName,
          sourceName: candidate.sourceName,
          sourceUrl: candidate.sourceUrl,
          sourceIdentifier: candidate.sourceIdentifier,
          importBatchId: candidate.importBatchId,
          originalRowNumber: candidate.originalRowNumber,
          status: "needs_review",
          duplicateReviewStatus: "administrator_approved",
        })
        .returning({ id: leads.id });
      importedLeadId = result[0].id;
      await tx.insert(businessSourceRecords).values({
        leadId: importedLeadId,
        candidateId: candidate.id,
        importBatchId: candidate.importBatchId,
        providerName: candidate.sourceName,
        sourceUrl: candidate.sourceUrl,
        sourceIdentifier: candidate.sourceIdentifier,
        originalRowNumber: candidate.originalRowNumber,
        minimizedSnapshot: candidate.originalData,
        discoveredAt: candidate.dateDiscovered,
      });
      status = "imported";
    } else if (input.decision === "update_existing") {
      if (!candidate.matchedLeadId) {
        throw new Error("No existing lead is associated with this candidate.");
      }
      const [existing] = await tx
        .select()
        .from(leads)
        .where(eq(leads.id, candidate.matchedLeadId))
        .limit(1);
      if (!existing) throw new Error("Existing lead was not found.");
      await tx
        .update(leads)
        .set({
          category: existing.category || candidate.category,
          industry: existing.industry || candidate.industry,
          address: existing.address || candidate.address,
          city: existing.city || candidate.city,
          state: existing.state || candidate.state,
          postalCode: existing.postalCode || candidate.postalCode,
          location: existing.location || candidate.location,
          websiteUrl: existing.websiteUrl || candidate.websiteUrl,
          websiteState:
            existing.websiteState === "unknown"
              ? candidate.websiteState
              : existing.websiteState,
          normalizedDomain:
            existing.normalizedDomain || candidate.normalizedDomain,
          email: existing.email || candidate.email,
          normalizedEmail: existing.normalizedEmail || candidate.normalizedEmail,
          phone: existing.phone || candidate.phone,
          normalizedPhone: existing.normalizedPhone || candidate.normalizedPhone,
          contactName: existing.contactName || candidate.contactName,
          sourceIdentifier:
            existing.sourceIdentifier || candidate.sourceIdentifier,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, existing.id));
      await tx.insert(businessSourceRecords).values({
        leadId: existing.id,
        candidateId: candidate.id,
        importBatchId: candidate.importBatchId,
        providerName: candidate.sourceName,
        sourceUrl: candidate.sourceUrl,
        sourceIdentifier: candidate.sourceIdentifier,
        originalRowNumber: candidate.originalRowNumber,
        minimizedSnapshot: candidate.originalData,
        attributionNotes: "Administrator approved filling missing fields only.",
        discoveredAt: candidate.dateDiscovered,
      });
      importedLeadId = existing.id;
      status = "duplicate";
    } else if (input.decision === "suppress") {
      const suppression = await tx
        .insert(suppressionEntries)
        .values({
          normalizedEmail: candidate.normalizedEmail,
          normalizedDomain: candidate.normalizedDomain,
          normalizedPhone: candidate.normalizedPhone,
          normalizedSourceIdentifier: candidate.sourceIdentifier,
          type: candidate.normalizedEmail
            ? "email"
            : candidate.normalizedDomain
              ? "domain"
              : candidate.normalizedPhone
                ? "phone"
                : "source_identifier",
          reason: input.reason || "Suppressed during import review",
          source: "Import review",
          createdBy: input.administratorEmail,
        })
        .returning({ id: suppressionEntries.id });
      await tx
        .update(importCandidates)
        .set({ suppressionEntryId: suppression[0].id })
        .where(eq(importCandidates.id, candidate.id));
      status = "suppressed";
    } else {
      status = input.decision === "mark_duplicate" ? "duplicate" : "skipped";
    }
    await tx
      .update(importCandidates)
      .set({
        status,
        importedLeadId,
        administratorDecision: input.decision,
        decidedBy: input.administratorEmail,
        decidedAt: new Date(),
      })
      .where(eq(importCandidates.id, candidate.id));
    await tx.insert(adminActivityLogs).values({
      adminEmail: input.administratorEmail,
      action: `import_candidate.${input.decision}`,
      entityType: "import_candidate",
      entityId: candidate.id,
    });
    const counts = await tx.execute<{
      imported: number;
      skipped: number;
      suppressed: number;
      duplicate: number;
    }>(sql`
      SELECT
        count(*) FILTER (WHERE status = 'imported')::int AS imported,
        count(*) FILTER (WHERE status = 'skipped')::int AS skipped,
        count(*) FILTER (WHERE status = 'suppressed')::int AS suppressed,
        count(*) FILTER (WHERE status = 'duplicate')::int AS duplicate
      FROM ${importCandidates}
      WHERE import_batch_id = ${candidate.importBatchId}
    `);
    await tx
      .update(importBatches)
      .set({
        importedRows: counts[0]?.imported ?? 0,
        skippedRows: counts[0]?.skipped ?? 0,
        suppressedRows: counts[0]?.suppressed ?? 0,
        duplicateRows: counts[0]?.duplicate ?? 0,
      })
      .where(eq(importBatches.id, candidate.importBatchId));
  });
}

export async function rejectedRowsCsv(batchId: string) {
  const rows = await getDb()
    .select()
    .from(importCandidates)
    .where(
      and(
        eq(importCandidates.importBatchId, batchId),
        or(
          eq(importCandidates.status, "invalid"),
          eq(importCandidates.status, "needs_review"),
          eq(importCandidates.status, "suppressed"),
          eq(importCandidates.status, "duplicate"),
        ),
      ),
    )
    .orderBy(importCandidates.originalRowNumber);
  const header = ["row_number", "business_name", "status", "errors", "warnings"];
  return [
    header.map(encodeCsvCell).join(","),
    ...rows.map((row) =>
      [
        row.originalRowNumber,
        row.businessName,
        row.status,
        row.validationErrors.join("; "),
        row.validationWarnings.join("; "),
      ]
        .map(encodeCsvCell)
        .join(","),
    ),
  ].join("\r\n");
}
