"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  confirmImportBatch,
  decideImportCandidate,
} from "@/lib/imports/service";

export async function confirmImportAction(batchId: string) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(batchId);
  await confirmImportBatch(id, admin.email);
  revalidatePath("/admin-portal/dashboard");
  revalidatePath("/admin-portal/leads");
  redirect(`/admin-portal/imports/${id}?confirmed=1`);
}

export async function decideCandidateAction(
  candidateId: string,
  formData: FormData,
) {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      decision: z.enum([
        "skip",
        "mark_duplicate",
        "import_as_new",
        "update_existing",
        "suppress",
      ]),
      reason: z.string().trim().max(500).optional(),
    })
    .parse({
      decision: String(formData.get("decision")),
      reason: String(formData.get("reason") || ""),
    });
  await decideImportCandidate({
    candidateId: z.string().uuid().parse(candidateId),
    administratorEmail: admin.email,
    ...parsed,
  });
  revalidatePath("/admin-portal/imports/review");
  revalidatePath("/admin-portal/dashboard");
}
