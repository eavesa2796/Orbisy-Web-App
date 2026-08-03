"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { addManualFinding, completeAuditReview, reopenAuditReview, reviewFinding } from "@/lib/audits/review";
import { cancelAuditJob, queueAuditJobs, retryAuditJob } from "@/lib/audits/service";
import { checkAdminMutationLimit } from "@/lib/rate-limit";

async function authorizeMutation(namespace: string) {
  const admin = await requireAdmin();
  if (!(await checkAdminMutationLimit(admin.email, namespace))) throw new Error("Too many audit changes. Wait one minute and try again.");
  return admin;
}
const uuid = z.uuid();

export async function queueAuditsAction(form: FormData) {
  const admin = await authorizeMutation("admin:audit-queue");
  const ids = z.array(uuid).min(1).max(25).parse(form.getAll("leadId").map(String));
  await queueAuditJobs(ids, admin.email); revalidatePath("/admin-portal/audits");
}
export async function cancelAuditAction(form: FormData) { const admin = await authorizeMutation("admin:audit-cancel"); await cancelAuditJob(uuid.parse(form.get("jobId")), admin.email); revalidatePath("/admin-portal/audits"); }
export async function retryAuditAction(form: FormData) { const admin = await authorizeMutation("admin:audit-retry"); await retryAuditJob(uuid.parse(form.get("jobId")), admin.email); revalidatePath("/admin-portal/audits"); }
export async function reviewFindingAction(form: FormData) {
  const admin = await authorizeMutation("admin:audit-review");
  const parsed = z.object({ findingId: uuid, status: z.enum(["verified", "rejected", "edited"]), explanation: z.string().trim().max(1000).optional() }).parse(Object.fromEntries(form));
  await reviewFinding({ ...parsed, actor: admin.email }); revalidatePath("/admin-portal/audits");
}
export async function addManualFindingAction(form: FormData) {
  const admin = await authorizeMutation("admin:audit-review");
  const parsed = z.object({ runId: uuid, category: z.enum(["mobile_usability", "conversion_path_cta", "performance", "technical_seo", "accessibility", "reliability_security", "manual_review_opportunity"]), severity: z.enum(["informational", "low", "medium", "high"]), confidence: z.enum(["low", "medium", "high"]), explanation: z.string().trim().min(5).max(1000), evidence: z.string().trim().min(3).max(1000), suggestedImprovement: z.string().trim().min(5).max(1000), affectedUrl: z.union([z.url(), z.literal("")]).optional() }).parse(Object.fromEntries(form));
  await addManualFinding({ ...parsed, affectedUrl: parsed.affectedUrl || undefined, actor: admin.email }); revalidatePath("/admin-portal/audits");
}
export async function completeAuditReviewAction(form: FormData) { const admin = await authorizeMutation("admin:audit-review"); await completeAuditReview(uuid.parse(form.get("runId")), admin.email); revalidatePath("/admin-portal/audits"); }
export async function reopenAuditReviewAction(form: FormData) { const admin = await authorizeMutation("admin:audit-review"); const parsed = z.object({ runId: uuid, explanation: z.string().trim().min(5).max(500) }).parse(Object.fromEntries(form)); await reopenAuditReview(parsed.runId, admin.email, parsed.explanation); revalidatePath("/admin-portal/audits"); }
