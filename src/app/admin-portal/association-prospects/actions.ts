"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { associationProspects } from "@/lib/db/schema";
import { queueAssociationIrsSample, queueAssociationScanJobs, retryAssociationScanJob } from "@/lib/association-prospects/worker";
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
    websiteCondition: z.enum(["unassessed", "website_not_confirmed", "no_major_issues_detected", "needs_manual_review", "significant_problems", "scan_failed", "blocked"]),
    reviewStatus: z.enum(["needs_review", "confirmed", "rejected"]),
    reviewNote: z.string().trim().max(1000).optional(),
  }).parse(Object.fromEntries(form));
  const db = getDb();
  await db.update(associationProspects).set({
    websiteUrl: input.websiteUrl || null,
    websiteCondition: input.websiteCondition,
    reviewStatus: input.reviewStatus,
    reviewNote: input.reviewNote || null,
    updatedAt: new Date(),
  }).where(eq(associationProspects.id, input.id));
  await db.execute(sql`insert into admin_activity_logs (admin_email, action, entity_type, entity_id, metadata) values (${admin.email}, 'association_prospect.reviewed', 'association_prospect', ${input.id}::uuid, ${JSON.stringify({ condition: input.websiteCondition, reviewStatus: input.reviewStatus })}::jsonb)`);
  revalidatePath("/admin-portal/association-prospects");
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
