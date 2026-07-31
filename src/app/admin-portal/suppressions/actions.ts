"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { adminActivityLogs, suppressionEntries } from "@/lib/db/schema";
import {
  normalizeEmail,
  normalizePhone,
  normalizeSourceIdentifier,
  normalizeWebsite,
} from "@/lib/imports/normalization";

export async function createSuppressionAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      type: z.enum(["email", "domain", "phone", "source_identifier"]),
      value: z.string().trim().min(1).max(500),
      reason: z.string().trim().min(1).max(1_000),
    })
    .parse({
      type: String(formData.get("type")),
      value: String(formData.get("value")),
      reason: String(formData.get("reason")),
    });
  const normalized =
    parsed.type === "email"
      ? normalizeEmail(parsed.value)
      : parsed.type === "domain"
        ? normalizeWebsite(parsed.value).normalizedDomain
        : parsed.type === "phone"
          ? normalizePhone(parsed.value)
          : normalizeSourceIdentifier(parsed.value);
  if (!normalized) throw new Error("The suppression value is invalid.");

  const db = getDb();
  await db.transaction(async (tx) => {
    const [entry] = await tx
      .insert(suppressionEntries)
      .values({
        type: parsed.type,
        normalizedEmail: parsed.type === "email" ? normalized : undefined,
        normalizedDomain: parsed.type === "domain" ? normalized : undefined,
        normalizedPhone: parsed.type === "phone" ? normalized : undefined,
        normalizedSourceIdentifier:
          parsed.type === "source_identifier" ? normalized : undefined,
        reason: parsed.reason,
        source: "Administrator",
        createdBy: admin.email,
      })
      .returning({ id: suppressionEntries.id });
    await tx.insert(adminActivityLogs).values({
      adminEmail: admin.email,
      action: "suppression.created",
      entityType: "suppression_entry",
      entityId: entry.id,
      metadata: { type: parsed.type },
    });
  });
  revalidatePath("/admin-portal/suppressions");
}
