"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { associationProspects, associationScanJobs } from "@/lib/db/schema";
import { lockAssociationScanQueue, queueAssociationIrsSample, queueAssociationScanJobs, queueAssociationScansInTransaction, retryAssociationScanJob } from "@/lib/association-prospects/worker";
import { parseAssociationContactDetails, stampManualContacts } from "@/lib/association-prospects/manual-contacts";
import { associationPipelineInput } from "@/lib/association-prospects/pipeline";
import { checkAdminMutationLimit } from "@/lib/rate-limit";

const states = "AL AK AS AZ AR CA CO CT DE DC FL GA GU HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MP MT NE NV NH NJ NM NY NC ND OH OK OR PW PA PR RI SC SD TN TX UT VT VI VA WA WV WI WY FM MH".split(" ");
const urlSchema = z.union([z.literal(""), z.url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol), "Use an http or https URL.")]);

async function authorize() {
  const admin = await requireAdmin();
  if (process.env.ASSOCIATION_PROSPECTING_ENABLED !== "true") {
    throw new Error("Association prospecting is currently disabled.");
  }
  if (!(await checkAdminMutationLimit(admin.email, "admin:association-prospects"))) {
    throw new Error("Too many changes. Wait one minute and try again.");
  }
  return admin;
}

export async function addAssociationProspectAction(form: FormData) {
  const admin = await authorize();
  const input = z.object({
    ein: z.string().trim().regex(/^\d{9}$/, "Enter the nine-digit EIN without punctuation."),
    name: z.string().trim().min(2).max(200),
    city: z.string().trim().max(120).optional(),
    state: z.string().trim().length(2).optional(),
    websiteUrl: urlSchema,
    sourceUrl: urlSchema,
  }).parse(Object.fromEntries(form));
  if (input.state && !states.includes(input.state.toUpperCase())) throw new Error("Enter a U.S. state or DC postal abbreviation.");
  const db = getDb();
  const result = await db.insert(associationProspects).values({
    ein: input.ein,
    name: input.name,
    city: input.city || null,
    state: input.state?.toUpperCase() || null,
    websiteUrl: input.websiteUrl || null,
    sourceUrl: input.sourceUrl || null,
  }).onConflictDoNothing({ target: associationProspects.ein }).returning({ id: associationProspects.id });
  if (!result.length) throw new Error("That EIN is already in your prospect list.");
  await db.execute(sql`insert into admin_activity_logs (admin_email, action, entity_type, entity_id, metadata) values (${admin.email}, 'association_prospect.created', 'association_prospect', ${result[0].id}, ${JSON.stringify({ ein: input.ein })}::jsonb)`);
  revalidatePath("/admin-portal/association-prospects");
}

export async function reviewAssociationProspectAction(form: FormData) {
  const admin = await authorize();
  const input = z.object({
    id: z.uuid(),
    websiteUrl: urlSchema,
    alternateName: z.string().trim().max(200),
    websiteCondition: z.enum(["unassessed", "website_not_confirmed", "no_major_issues_detected", "needs_manual_review", "significant_problems", "scan_failed", "blocked"]),
    reviewStatus: z.enum(["needs_review", "confirmed", "rejected"]),
    reviewNote: z.string().trim().max(1000).optional(),
    queueFresh: z.literal("true").optional(),
  }).parse(Object.fromEntries(form));
  await getDb().transaction(async (tx) => {
    await lockAssociationScanQueue(tx);
    const [record] = await tx.select().from(associationProspects).where(eq(associationProspects.id, input.id)).for("update");
    if (!record) throw new Error("Association prospect not found.");
    const [activeJob] = await tx.select({ id: associationScanJobs.id }).from(associationScanJobs).where(and(
      eq(associationScanJobs.prospectId, input.id),
      inArray(associationScanJobs.status, ["queued", "running"]),
    )).limit(1);
    if (activeJob) throw new Error("Wait for the active scan before editing this record.");

    const websiteUrl = input.websiteUrl ? new URL(input.websiteUrl).href : null;
    const existingUrl = record.websiteUrl ? new URL(record.websiteUrl).href : null;
    const alternateName = input.alternateName || null;
    const reset = websiteUrl !== existingUrl || alternateName !== record.alternateName || input.queueFresh === "true";
    const websiteCondition = reset ? "unassessed" : input.websiteCondition;
    const reviewStatus = reset && !websiteUrl ? "needs_review" : input.reviewStatus;
    await tx.update(associationProspects).set({
      websiteUrl,
      alternateName,
      websiteCondition,
      reviewStatus,
      reviewNote: input.reviewNote || null,
      updatedAt: new Date(),
      ...(reset ? { publicContacts: [], evidence: [], lastCheckedAt: null } : {}),
    }).where(eq(associationProspects.id, input.id));

    if (input.queueFresh === "true") {
      await queueAssociationScansInTransaction(tx, [input.id], admin.email);
    }
    await tx.execute(sql`insert into admin_activity_logs (admin_email, action, entity_type, entity_id, metadata) values (${admin.email}, 'association_prospect.reviewed', 'association_prospect', ${input.id}::uuid, ${JSON.stringify({ condition: websiteCondition, reviewStatus })}::jsonb)`);
  });
  revalidatePath("/admin-portal/association-prospects");
}

export async function saveAssociationContactDetailsAction(_previous: { success: boolean; message: string }, form: FormData) {
  const admin = await authorize();
  const id = z.uuid().parse(form.get("id"));
  let details;
  try {
    details = parseAssociationContactDetails(form);
  } catch (error) {
    return { success: false, message: error instanceof z.ZodError ? "Check the contact lengths and try again." : error instanceof Error ? error.message : "Check the contact details and try again." };
  }
  const { contacts, outreachReason } = details;

  await getDb().transaction(async (tx) => {
    const [record] = await tx.select({ manualContacts: associationProspects.manualContacts })
      .from(associationProspects).where(eq(associationProspects.id, id)).for("update");
    if (!record) throw new Error("Association prospect not found.");
    const now = new Date();
    const manualContacts = stampManualContacts(contacts, record.manualContacts, now);
    await tx.update(associationProspects)
      .set({ manualContacts, outreachReason, updatedAt: now })
      .where(eq(associationProspects.id, id));
    await tx.execute(sql`insert into admin_activity_logs (admin_email, action, entity_type, entity_id, metadata)
      values (${admin.email}, 'association_prospect.contact_details_saved', 'association_prospect', ${id}::uuid,
      ${JSON.stringify({ channels: manualContacts.map((item) => item.type), hasReason: Boolean(outreachReason) })}::jsonb)`);
  });

  revalidatePath("/admin-portal/association-prospects");
  return { success: true, message: "Contact details saved." };
}

export async function saveAssociationPipelineAction(_previous: { success: boolean; message: string }, form: FormData) {
  const admin = await authorize();
  const id = z.uuid().parse(form.get("id"));
  const parsed = associationPipelineInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message || "Check the sales plan and try again." };
  const { stage, action, dueDate, lastInteraction } = parsed.data;

  const error = await getDb().transaction(async (tx) => {
    const [record] = await tx.select({
      reviewStatus: associationProspects.reviewStatus,
      outreachReason: associationProspects.outreachReason,
      manualContacts: associationProspects.manualContacts,
      publicContacts: associationProspects.publicContacts,
      previousStage: associationProspects.salesStage,
    }).from(associationProspects).where(eq(associationProspects.id, id)).for("update");
    if (!record) return "Association prospect not found.";
    if (stage === "ready_to_contact" && (
      record.reviewStatus !== "confirmed" || !record.outreachReason?.trim()
      || ![...record.manualContacts, ...record.publicContacts].some((contact) => contact.value && contact.sourceUrl)
    )) {
      return "Confirm the record, save a sourced contact, and add a reason before marking it ready.";
    }

    await tx.update(associationProspects).set({
      salesStage: stage,
      salesNextAction: action || null,
      salesNextActionDate: dueDate || null,
      salesLastInteraction: lastInteraction || null,
      updatedAt: new Date(),
    }).where(eq(associationProspects.id, id));
    await tx.execute(sql`insert into admin_activity_logs (admin_email, action, entity_type, entity_id, metadata)
      values (${admin.email}, 'association_prospect.sales_plan_saved', 'association_prospect', ${id}::uuid,
      ${JSON.stringify({ previousStage: record.previousStage, stage, dueDate: dueDate || null })}::jsonb)`);
    return null;
  });

  if (error) return { success: false, message: error };
  revalidatePath("/admin-portal/association-prospects");
  return { success: true, message: "Sales plan saved." };
}

export async function queueAssociationScansAction(form: FormData) {
  const admin = await authorize();
  const ids = z.array(z.uuid()).min(1).max(5).parse(form.getAll("prospectId").map(String));
  await queueAssociationScanJobs(ids, admin.email);
  revalidatePath("/admin-portal/association-prospects");
}

export async function retryAssociationScanAction(form: FormData) {
  const admin = await authorize();
  const id = z.uuid().parse(form.get("jobId"));
  await retryAssociationScanJob(id, admin.email);
  revalidatePath("/admin-portal/association-prospects");
}

export async function queueAssociationIrsSampleAction(form: FormData) {
  const admin = await authorize();
  const input = z.object({ state: z.string().length(2), sampleLimit: z.coerce.number().int().refine((value) => [5, 10, 25].includes(value)) }).parse(Object.fromEntries(form));
  await queueAssociationIrsSample(input.state, input.sampleLimit, admin.email);
  revalidatePath("/admin-portal/association-prospects");
}
