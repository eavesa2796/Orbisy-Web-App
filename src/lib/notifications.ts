import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { contactSubmissions, submissionNotifications } from "@/lib/db/schema";
export async function notifySubmission(
  type: string,
  businessName: string,
  idempotencyKey: string,
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
        subject: `New Orbisy ${type.replaceAll("_", " ")} request`,
        text: `A new request from ${businessName} was saved. Sign in to the Orbisy administrator portal to review it.`,
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
  const result = await notifySubmission(
    submission.type,
    submission.businessName,
    claimed.id,
  );
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
