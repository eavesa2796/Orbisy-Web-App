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
