import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { contactSubmissions, submissionNotifications } from "@/lib/db/schema";
import { leads } from "@/lib/db/schema";
import { siteConfig } from "@/lib/config";
export async function notifySubmission(
  submission: typeof contactSubmissions.$inferSelect,
  idempotencyKey: string,
  leadId?: string,
) {
  const apiKey = process.env.RESEND_API_KEY,
    from = process.env.RESEND_FROM_EMAIL,
    to = process.env.NOTIFICATION_EMAIL;
  if (!apiKey || !from || !to)
    return {
      status: "not_configured",
      error: "Missing notification configuration",
    } as const;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `orbisy-inquiry-${idempotencyKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `New Orbisy inquiry: ${submission.businessName.replace(/[\r\n]+/g, " ")}`,
        reply_to: submission.email,
        text: [
          "A new inquiry was saved in Orbisy.",
          "",
          `Name: ${submission.name}`,
          `Business: ${submission.businessName}`,
          `Email: ${submission.email}`,
          `Website: ${submission.websiteUrl || "Not provided"}`,
          `Service: ${submission.serviceNeeded || submission.type.replaceAll("_", " ")}`,
          `Budget: ${submission.budgetRange || "Not provided"}`,
          `Timeline: ${submission.timeline || "Not provided"}`,
          "",
          "Inquiry:",
          submission.projectDescription ||
            submission.websiteConcern ||
            submission.primaryGoal ||
            "No additional message provided.",
          "",
          `Review saved inquiry: ${new URL(leadId ? `/admin-portal/leads/${leadId}` : "/admin-portal/leads", siteConfig.url).href}`,
          "Administrator sign-in is required. Budget ranges are client estimates, not Orbisy service prices.",
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(5000),
    });
    return response.ok
      ? ({ status: "sent", error: null } as const)
      : ({
          status: "failed",
          error: `Email provider returned HTTP ${response.status}`,
        } as const);
  } catch {
    return {
      status: "failed",
      error: "Email provider unavailable or timed out",
    } as const;
  }
}
export async function deliverSubmissionNotification(id: string) {
  const db = getDb(),
    leaseToken = crypto.randomUUID();
  // Atomic lease prevents duplicate retry clicks; a crashed worker can be retried after ten minutes.
  const [claimed] = await db
    .update(submissionNotifications)
    .set({
      status: "sending",
      leaseToken,
      attempts: sql`${submissionNotifications.attempts}+1`,
      lastAttemptAt: new Date(),
      lastError: null,
    })
    .where(
      and(
        eq(submissionNotifications.id, id),
        sql`(${submissionNotifications.status} in ('pending','failed','not_configured') and (${submissionNotifications.lastAttemptAt} is null or ${submissionNotifications.lastAttemptAt} < now()-interval '60 seconds')) or (${submissionNotifications.id}=${id} and ${submissionNotifications.status}='sending' and ${submissionNotifications.lastAttemptAt}<now()-interval '10 minutes')`,
      ),
    )
    .returning();
  if (!claimed) return false;
  const [submission] = await db
    .select()
    .from(contactSubmissions)
    .where(eq(contactSubmissions.id, claimed.submissionId))
    .limit(1);
  if (!submission) throw new Error("NOTIFICATION_SUBMISSION_MISSING");
  const [lead] = await db
    .select({ id: leads.id })
    .from(leads)
    .where(eq(leads.submissionId, submission.id))
    .limit(1);
  const result = await notifySubmission(submission, claimed.id, lead?.id);
  await db
    .update(submissionNotifications)
    .set({
      status: result.status,
      lastError: result.error,
      sentAt: result.status === "sent" ? new Date() : null,
      leaseToken: null,
    })
    .where(
      and(
        eq(submissionNotifications.id, id),
        eq(submissionNotifications.leaseToken, leaseToken),
      ),
    );
  if (result.status !== "sent")
    console.warn("Orbisy saved inquiry notification needs attention", {
      notificationId: id,
      status: result.status,
      reason: result.error,
    });
  return result.status === "sent";
}
