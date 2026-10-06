"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { adminActivityLogs, pricingEntries } from "@/lib/db/schema";
import { pricingSchema } from "@/lib/pricing";
import { pricingTemplates } from "@/lib/pricing-draft";
export async function savePricingAction(
  _previous: { message: string; success: boolean },
  form: FormData,
) {
  const admin = await requireAdmin();
  const parsed = pricingSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      message: parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(" "),
      success: false,
    };
  const p = parsed.data;
  try {
    const db = getDb();
    await db.transaction(async (tx) => {
      const values = {
        name: p.name,
        category: p.category,
        description: p.description,
        deliverables: p.deliverables,
        billingBasis: p.billingBasis,
        amountCents: p.amount,
        setupFeeCents: p.setupFee,
        recurringFeeCents: p.recurringFee,
        recurringInterval: p.recurringInterval || null,
        internalNotes: p.internalNotes,
        status: p.status,
        updatedBy: admin.email,
        updatedAt: new Date(),
      };
      const [entry] = p.id
        ? await tx
            .update(pricingEntries)
            .set(values)
            .where(eq(pricingEntries.id, p.id))
            .returning({ id: pricingEntries.id })
        : await tx
            .insert(pricingEntries)
            .values(values)
            .returning({ id: pricingEntries.id });
      if (!entry) throw new Error("PRICING_NOT_FOUND");
      await tx
        .insert(adminActivityLogs)
        .values({
          adminEmail: admin.email,
          action: p.id ? "pricing_updated" : "pricing_created",
          entityType: "pricing_entry",
          entityId: entry.id,
          metadata: { status: p.status, category: p.category },
        });
    });
  } catch {
    return {
      message:
        "The entry could not be saved. Confirm the database connection and migration, then retry.",
      success: false,
    };
  }
  revalidatePath("/admin-portal/pricing");
  return { message: "Pricing entry saved privately.", success: true };
}
export async function addPricingTemplatesAction() {
  const admin = await requireAdmin();
  await getDb().transaction(async (tx) => {
    for (const [
      templateKey,
      name,
      category,
      billingBasis,
      deliverables,
    ] of pricingTemplates) {
      await tx
        .insert(pricingEntries)
        .values({
          templateKey,
          name,
          category,
          billingBasis,
          deliverables: deliverables.split("; "),
          description:
            "Confirm scope and deliverables before using in a proposal.",
          internalNotes:
            "Owner review required. No prices have been confirmed.",
          updatedBy: admin.email,
        })
        .onConflictDoNothing({ target: pricingEntries.templateKey });
    }
    await tx
      .insert(adminActivityLogs)
      .values({
        adminEmail: admin.email,
        action: "pricing_templates_added",
        entityType: "pricing_catalog",
        metadata: { amountsSet: false },
      });
  });
  revalidatePath("/admin-portal/pricing");
}
