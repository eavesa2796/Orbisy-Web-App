import "server-only";
import { getDb } from "@/lib/db";
import {
  contactSubmissions,
  leads,
  submissionNotifications,
} from "@/lib/db/schema";
import type {
  homepageReviewSchema,
  projectRequestSchema,
} from "@/lib/validation";
import type { z } from "zod";
export async function saveInquiry(
  type: "homepage-review" | "project-request",
  data:
    z.infer<typeof homepageReviewSchema> | z.infer<typeof projectRequestSchema>,
) {
  const project =
    type === "project-request"
      ? (data as z.infer<typeof projectRequestSchema>)
      : null;
  const review =
    type === "homepage-review"
      ? (data as z.infer<typeof homepageReviewSchema>)
      : null;
  return getDb().transaction(async (tx) => {
    const [submission] = await tx
      .insert(contactSubmissions)
      .values({
        type:
          type === "homepage-review" ? "homepage_review" : "project_request",
        name: data.name,
        businessName: data.businessName,
        email: data.email.toLowerCase(),
        websiteUrl: data.websiteUrl,
        primaryGoal: review?.primaryGoal,
        websiteConcern: review?.websiteConcern,
        serviceNeeded: project?.serviceNeeded,
        projectDescription: project?.projectDescription,
        timeline: project?.timeline,
        budgetRange: project?.budgetRange,
        attribution: data.attribution,
        idempotencyKey: data.submissionToken ?? crypto.randomUUID(),
        consentVersion: "privacy-2026-10-03",
      })
      .onConflictDoNothing({ target: contactSubmissions.idempotencyKey })
      .returning({ id: contactSubmissions.id });
    if (!submission) return { duplicate: true, notificationId: null };
    await tx
      .insert(leads)
      .values({
        submissionId: submission.id,
        businessName: data.businessName,
        contactName: data.name,
        email: data.email.toLowerCase(),
        websiteUrl: data.websiteUrl,
        websiteState: data.websiteUrl ? "provided" : "unknown",
        sourceName:
          type === "homepage-review"
            ? "Inbound homepage review"
            : "Inbound consultation",
        sourceUrl: data.attribution?.submissionPath,
        status: "new_inbound",
        priority: type === "homepage-review" ? 100 : 90,
      });
    const [notification] = await tx
      .insert(submissionNotifications)
      .values({ submissionId: submission.id })
      .returning({ id: submissionNotifications.id });
    return { duplicate: false, notificationId: notification.id };
  });
}
