"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { adminActivityLogs, appSettings } from "@/lib/db/schema";

const settingsSchema = z
  .object({
    targetIndustries: z.array(z.string().trim().min(1).max(120)).min(1).max(25),
    targetLocations: z.array(z.string().trim().min(1).max(120)).min(1).max(25),
    maxCsvBytes: z.coerce.number().int().min(100_000).max(5_000_000),
    maxRowsPerBatch: z.coerce.number().int().min(10).max(2_000),
    defaultSourceName: z.string().trim().min(1).max(120),
    likelyDuplicateThreshold: z.coerce.number().int().min(75).max(100),
    possibleDuplicateThreshold: z.coerce.number().int().min(40).max(90),
    possibleDuplicatesRequireReview: z.boolean(),
    missingWebsitesRequireReview: z.boolean(),
    importRetentionDays: z.coerce.number().int().min(30).max(2_555),
    defaultPageSize: z.coerce.number().int().min(10).max(100),
    preflightEnabled: z.boolean(), workerEnabled: z.boolean(),
    maxPreflightJobsPerDay: z.coerce.number().int().min(1).max(1000),
    maxJobsPerWorkerRun: z.coerce.number().int().min(1).max(25),
    maxConcurrentJobs: z.coerce.number().int().min(1).max(10),
    perDomainDelayMs: z.coerce.number().int().min(500).max(60_000),
    dnsTimeoutMs: z.coerce.number().int().min(500).max(15_000),
    connectionTimeoutMs: z.coerce.number().int().min(1000).max(30_000),
    overallRequestTimeoutMs: z.coerce.number().int().min(2000).max(60_000),
    maxRedirects: z.coerce.number().int().min(0).max(10),
    maxResponseBytes: z.coerce.number().int().min(50_000).max(5_000_000),
    preflightRetryLimit: z.coerce.number().int().min(1).max(5),
    retryBackoffSeconds: z.coerce.number().int().min(10).max(86_400),
    preflightRecheckDays: z.coerce.number().int().min(1).max(365),
    minimumBusinessFitScore: z.coerce.number().int().min(0).max(100),
    requireTargetIndustry: z.boolean(), requireTargetLocation: z.boolean(),
    fetcherUserAgent: z.string().trim().min(20).max(255),
  })
  .refine(
    (settings) =>
      settings.possibleDuplicateThreshold < settings.likelyDuplicateThreshold,
    { message: "Possible threshold must be lower than likely threshold." },
  );

function lines(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function updateSettingsAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = settingsSchema.parse({
    targetIndustries: lines(formData.get("targetIndustries")),
    targetLocations: lines(formData.get("targetLocations")),
    maxCsvBytes: formData.get("maxCsvBytes"),
    maxRowsPerBatch: formData.get("maxRowsPerBatch"),
    defaultSourceName: formData.get("defaultSourceName"),
    likelyDuplicateThreshold: formData.get("likelyDuplicateThreshold"),
    possibleDuplicateThreshold: formData.get("possibleDuplicateThreshold"),
    possibleDuplicatesRequireReview:
      formData.get("possibleDuplicatesRequireReview") === "on",
    missingWebsitesRequireReview:
      formData.get("missingWebsitesRequireReview") === "on",
    importRetentionDays: formData.get("importRetentionDays"),
    defaultPageSize: formData.get("defaultPageSize"),
    preflightEnabled: formData.get("preflightEnabled") === "on",
    workerEnabled: formData.get("workerEnabled") === "on",
    maxPreflightJobsPerDay: formData.get("maxPreflightJobsPerDay"), maxJobsPerWorkerRun: formData.get("maxJobsPerWorkerRun"), maxConcurrentJobs: formData.get("maxConcurrentJobs"),
    perDomainDelayMs: formData.get("perDomainDelayMs"), dnsTimeoutMs: formData.get("dnsTimeoutMs"), connectionTimeoutMs: formData.get("connectionTimeoutMs"), overallRequestTimeoutMs: formData.get("overallRequestTimeoutMs"),
    maxRedirects: formData.get("maxRedirects"), maxResponseBytes: formData.get("maxResponseBytes"), preflightRetryLimit: formData.get("preflightRetryLimit"), retryBackoffSeconds: formData.get("retryBackoffSeconds"), preflightRecheckDays: formData.get("preflightRecheckDays"), minimumBusinessFitScore: formData.get("minimumBusinessFitScore"),
    requireTargetIndustry: formData.get("requireTargetIndustry") === "on", requireTargetLocation: formData.get("requireTargetLocation") === "on", fetcherUserAgent: formData.get("fetcherUserAgent"),
  });
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .insert(appSettings)
      .values({ id: "default", ...parsed, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: appSettings.id,
        set: { ...parsed, updatedAt: new Date() },
      });
    await tx.insert(adminActivityLogs).values({
      adminEmail: admin.email,
      action: "settings.imports_updated",
      entityType: "app_settings",
      metadata: {
        targetIndustryCount: parsed.targetIndustries.length,
        targetLocationCount: parsed.targetLocations.length,
      },
    });
  });
  revalidatePath("/admin-portal/settings");
}
