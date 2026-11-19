import "server-only";
import {and,asc,eq,inArray,lte,sql} from "drizzle-orm";
import {getDb} from "@/lib/db";
import {followupSettings,followupConversations,followupMessages,followupEvents} from "@/lib/db/schema";
import {chicagoParts,FOLLOWUP_MAILBOX,nextSendingTime,outboundEnabled,withinSendingHours} from "./model";
import {getFollowupSettings,enrollNewInquiries,stopConversationsForLeadChanges} from "./service";
import {mailingConfigurationReady} from "./security";
import {syncGmail} from "./gmail";
import {deliverFollowupMessage,reconcileDeliveryEvents} from "./delivery";
export async function queueDailyDigest(now=new Date()){
 const settings=await getFollowupSettings();const local=chicagoParts(now);
 await getDb().update(followupMessages).set({status:"cancelled",lastError:"An older or disabled daily digest was skipped."}).where(and(eq(followupMessages.kind,"digest"),eq(followupMessages.status,"approved"),sql`(${followupMessages.dedupKey} <> ${`digest:${local.date}`} OR ${!settings.digestEnabled})`));
 if(!settings.digestEnabled||local.hour<settings.digestHour||local.hour>=21)return false;
 const db=getDb();const conversations=await db.select().from(followupConversations).where(inArray(followupConversations.state,["needs_response","waiting_reply","paused"]));const pending=await db.select({id:followupMessages.id}).from(followupMessages).where(eq(followupMessages.status,"draft"));
 const [saved]=await db.insert(followupMessages).values({dedupKey:`digest:${local.date}`,kind:"digest",recipientEmail:FOLLOWUP_MAILBOX,subject:`Orbisy follow-up digest · ${local.date}`,body:`Your Orbisy follow-up queue\n\n${conversations.filter(c=>c.state==="needs_response").length} conversations need a personal response.\n${conversations.filter(c=>c.state==="paused"&&c.replyAt).length} contacts replied and need your review.\n${pending.length} email drafts await review.\n\nReview: https://www.orbisy.com/admin-portal/followups\nAdministrator sign-in is required.`,dueAt:nextSendingTime(now),status:"approved",approvedAt:now,approvedBy:"Daily digest setting"}).onConflictDoNothing().returning({id:followupMessages.id});return !!saved;
}
export async function runFollowupWorker(){if(process.env.VERCEL_ENV!=="production")return {status:"disabled_on_this_deployment",sent:0,enrolled:0};await getFollowupSettings();const db=getDb(),now=new Date(),lease=crypto.randomUUID();
 const [claimed]=await db.update(followupSettings).set({workerLease:lease,workerLeaseUntil:new Date(now.getTime()+180000),lastWorkerAt:now}).where(and(eq(followupSettings.id,"main"),sql`(${followupSettings.workerLeaseUntil} is null or ${followupSettings.workerLeaseUntil}<${now})`)).returning();if(!claimed)return {status:"already_running",sent:0,enrolled:0};
 try{
 await stopConversationsForLeadChanges();await reconcileDeliveryEvents();const enrolled=await enrollNewInquiries();await queueDailyDigest(now);
 // Recover an interrupted send using the durable marker, never outside the provider's key window.
 await db.update(followupMessages).set({status:"approved",leaseToken:null}).where(and(eq(followupMessages.status,"sending"),sql`${followupMessages.lastAttemptAt}<now()-interval '10 minutes'`,sql`${followupMessages.firstAttemptAt}>now()-interval '23 hours'`));
 await db.update(followupMessages).set({status:"uncertain",leaseToken:null,lastError:"Interrupted send is outside the safe retry window. Check provider logs."}).where(and(eq(followupMessages.status,"sending"),sql`${followupMessages.firstAttemptAt}<=now()-interval '23 hours'`));
 const gmailReady=await syncGmail();
 if(!outboundEnabled())return {status:"sending_disabled",enrolled,sent:0};
 if(!gmailReady)return {status:"gmail_sync_required",enrolled,sent:0};
 const currentSettings=await getFollowupSettings();
 const eligibleKinds=["acknowledgment",...(withinSendingHours(now)&&currentSettings.digestEnabled?["digest"]:[]),...(withinSendingHours(now)&&mailingConfigurationReady()?["followup_one","followup_two"]:[])];
 const due=await db.select({id:followupMessages.id}).from(followupMessages).where(and(inArray(followupMessages.kind,eligibleKinds),eq(followupMessages.status,"approved"),lte(followupMessages.dueAt,now),sql`(${followupMessages.nextAttemptAt} is null or ${followupMessages.nextAttemptAt}<=${now})`)).orderBy(sql`CASE ${followupMessages.kind} WHEN 'acknowledgment' THEN 0 WHEN 'digest' THEN 1 WHEN 'followup_one' THEN 2 ELSE 3 END`,asc(followupMessages.dueAt)).limit(3);
 let sent=0;for(const message of due)if(await deliverFollowupMessage(message.id))sent++;return {status:"complete",enrolled,sent};
 }catch{await db.insert(followupEvents).values({kind:"worker_error",detail:"Follow-up processing failed. Saved inquiries are unaffected; review Gmail and sending configuration."});return {status:"needs_attention",sent:0,enrolled:0};}
 finally{await db.update(followupSettings).set({workerLease:null,workerLeaseUntil:null}).where(and(eq(followupSettings.id,"main"),eq(followupSettings.workerLease,lease)));}
}
