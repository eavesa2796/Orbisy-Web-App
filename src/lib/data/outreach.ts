import "server-only";
import {desc,isNull,and,inArray} from "drizzle-orm";
import {requireAdmin} from "@/lib/auth";
import {getDb} from "@/lib/db";
import {leads,outreachCampaigns,outreachEnrollments,outreachMessages,outreachEvents} from "@/lib/db/schema";
import {getOutreachSettings} from "@/lib/outreach/service";
import {gmailConfigurationReady} from "@/lib/followups/gmail";
import {mailingConfigurationReady} from "@/lib/followups/security";
import {outreachEnabled} from "@/lib/outreach/model";
export async function getOutreachOverview(){await requireAdmin();const settings=await getOutreachSettings();const db=getDb();const [campaigns,enrollments,prospects,events]=await Promise.all([
 db.select().from(outreachCampaigns).orderBy(desc(outreachCampaigns.createdAt)).limit(100),
 db.select().from(outreachEnrollments).orderBy(desc(outreachEnrollments.createdAt)).limit(100),
 db.select({id:leads.id,businessName:leads.businessName,contactName:leads.contactName,email:leads.email,sourceUrl:leads.sourceUrl,websiteUrl:leads.websiteUrl}).from(leads).where(and(isNull(leads.submissionId),inArray(leads.status,["needs_review","manually_added","qualified","contact_planned","contacted"]))).orderBy(desc(leads.updatedAt)).limit(100),
 db.select().from(outreachEvents).orderBy(desc(outreachEvents.occurredAt)).limit(30),
 ]);
 const messages=enrollments.length?await db.select({id:outreachMessages.id,enrollmentId:outreachMessages.enrollmentId,step:outreachMessages.step,subject:outreachMessages.subject,body:outreachMessages.body,status:outreachMessages.status,dueAt:outreachMessages.dueAt,firstAttemptAt:outreachMessages.firstAttemptAt,sentAt:outreachMessages.sentAt,lastError:outreachMessages.lastError}).from(outreachMessages).where(inArray(outreachMessages.enrollmentId,enrollments.map(e=>e.id))):[];
 return {settings:{sendingEnabled:settings.sendingEnabled,dailyLimit:settings.dailyLimit,gmailConnected:!!settings.gmailTokenCiphertext,gmailSyncedAt:settings.gmailSyncedAt,gmailError:settings.gmailError,gmailBacklog:!!settings.gmailPageToken,lastWorkerAt:settings.lastWorkerAt,policyReviewed:!!settings.policyReviewedAt},readiness:{deployment:outreachEnabled(),google:gmailConfigurationReady(),mailing:mailingConfigurationReady()},campaigns,enrollments,messages,prospects,events};
}
export type OutreachOverview=Awaited<ReturnType<typeof getOutreachOverview>>;
