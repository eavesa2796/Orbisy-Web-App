import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  contactSubmissions,
  leads,
  submissionNotifications,
} from "@/lib/db/schema";
export async function getInquiryForLead(id: string) {
  await requireAdmin();
  const [row] = await getDb()
    .select({
      submission: contactSubmissions,
      notification: submissionNotifications,
    })
    .from(leads)
    .innerJoin(
      contactSubmissions,
      eq(leads.submissionId, contactSubmissions.id),
    )
    .leftJoin(
      submissionNotifications,
      eq(submissionNotifications.submissionId, contactSubmissions.id),
    )
    .where(eq(leads.id, id))
    .limit(1);
  return row ?? null;
}
export async function getInquiryNotifications() {
  await requireAdmin();
  return getDb()
    .select({
      notification: submissionNotifications,
      businessName: contactSubmissions.businessName,
      service: contactSubmissions.serviceNeeded,
      leadId: leads.id,
    })
    .from(submissionNotifications)
    .innerJoin(
      contactSubmissions,
      eq(submissionNotifications.submissionId, contactSubmissions.id),
    )
    .leftJoin(leads, eq(leads.submissionId, contactSubmissions.id))
    .orderBy(
      sql`case when ${submissionNotifications.status}='sent' then 1 else 0 end`,
      desc(submissionNotifications.createdAt),
    )
    .limit(100);
}
