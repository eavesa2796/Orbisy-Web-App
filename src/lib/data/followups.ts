import "server-only";
import {and,desc,eq,inArray,isNull,or} from "drizzle-orm";
import {requireAdmin} from "@/lib/auth";
import {getDb} from "@/lib/db";
import {followupConversations,followupMessages,followupEvents,leads} from "@/lib/db/schema";
import {getFollowupSettings} from "@/lib/followups/service";
import {gmailConfigurationReady} from "@/lib/followups/gmail";
import {mailingConfigurationReady,resendWebhookConfigured} from "@/lib/followups/security";
import {outboundEnabled} from "@/lib/followups/model";
export async function getFollowupOverview(){await requireAdmin();const settings=await getFollowupSettings();const db=getDb();const conversations=await db.select({conversation:followupConversations,businessName:leads.businessName,status:leads.status}).from(followupConversations).innerJoin(leads,eq(followupConversations.leadId,leads.id)).orderBy(desc(followupConversations.updatedAt)).limit(50);const ids=conversations.map(x=>x.conversation.id);
 const [messages,events]=await Promise.all([ids.length?db.select({id:followupMessages.id,conversationId:followupMessages.conversationId,kind:followupMessages.kind,status:followupMessages.status,subject:followupMessages.subject,body:followupMessages.body,dueAt:followupMessages.dueAt,acceptedAt:followupMessages.acceptedAt,firstAttemptAt:followupMessages.firstAttemptAt,lastError:followupMessages.lastError,attempts:followupMessages.attempts}).from(followupMessages).where(inArray(followupMessages.conversationId,ids)).orderBy(followupMessages.dueAt):[],db.select().from(followupEvents).where(or(ids.length?inArray(followupEvents.conversationId,ids):undefined,and(isNull(followupEvents.conversationId),inArray(followupEvents.kind,["worker_error","settings_updated"])))).orderBy(desc(followupEvents.occurredAt)).limit(200)]);
 return {settings:{enrollmentEnabled:settings.enrollmentEnabled,sendingEnabled:settings.sendingEnabled,autoAcknowledge:settings.autoAcknowledge,activatedAt:settings.activatedAt,templates:settings.templates,digestEnabled:settings.digestEnabled,digestHour:settings.digestHour,gmailConnected:!!settings.gmailTokenCiphertext,gmailSyncedAt:settings.gmailSyncedAt,gmailError:settings.gmailError,gmailBacklog:!!settings.gmailPageToken,lastWorkerAt:settings.lastWorkerAt},readiness:{gmail: gmailConfigurationReady(),sending:outboundEnabled(),resend:!!process.env.RESEND_API_KEY&&!!process.env.RESEND_FROM_EMAIL,webhook:resendWebhookConfigured(),mailing:mailingConfigurationReady(),scheduler:!!process.env.FOLLOWUP_CRON_SECRET&&process.env.FOLLOWUP_CRON_SECRET.length>=32},conversations,messages,events};
}
export type FollowupOverview=Awaited<ReturnType<typeof getFollowupOverview>>;
