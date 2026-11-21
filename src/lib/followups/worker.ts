import "server-only";
import {and,asc,eq,inArray,isNull,lt,lte,ne,or,sql} from "drizzle-orm";
import {getDb} from "@/lib/db";
import {followupSettings,followupMessages,followupEvents} from "@/lib/db/schema";
import {chicagoParts,FOLLOWUP_MAILBOX,nextSendingTime,outboundEnabled,withinSendingHours} from "./model";
import {getFollowupSettings,enrollNewInquiries,stopConversationsForLeadChanges} from "./service";
import {mailingConfigurationReady} from "./security";
import {syncGmail} from "./gmail";
import {deliverFollowupMessage,reconcileDeliveryEvents} from "./delivery";
import {dailyDigestKey,digestWindowOpen,loadDigestSnapshot,renderDailyDigest} from "./digest";
export async function queueDailyDigest(now=new Date()){
 const settings=await getFollowupSettings(),db=getDb(),key=dailyDigestKey(now);
 await db.update(followupMessages).set({status:"cancelled",lastError:"An older or disabled daily digest was skipped."})
  .where(and(eq(followupMessages.kind,"digest"),eq(followupMessages.status,"approved"),or(ne(followupMessages.dedupKey,key),!settings.digestEnabled?sql`true`:undefined)));
 const cancelUnattempted = async (reason:string) => db.update(followupMessages).set({status:"cancelled",lastError:reason})
  .where(and(eq(followupMessages.kind,"digest"),eq(followupMessages.dedupKey,key),eq(followupMessages.status,"approved"),isNull(followupMessages.firstAttemptAt)));
 if(!settings.digestEnabled||!settings.sendingEnabled||!digestWindowOpen(now,settings.digestHour)){
  await cancelUnattempted("Daily digest is paused or outside the selected Chicago sending time.");return false;
 }
 const snapshot=await loadDigestSnapshot(db,now);
 if(!snapshot.hasActions){await cancelUnattempted("No follow-up actions need attention; empty daily digest skipped.");return false;}
 const content={subject:`Orbisy follow-up digest · ${chicagoParts(now).date}`,body:renderDailyDigest(snapshot,now),dueAt:nextSendingTime(now),status:"approved",approvedAt:now,approvedBy:"Daily digest setting",lastError:null};
 const [saved]=await db.insert(followupMessages).values({dedupKey:key,kind:"digest",recipientEmail:FOLLOWUP_MAILBOX,...content}).onConflictDoNothing().returning({id:followupMessages.id});
 if(!saved)await db.update(followupMessages).set(content).where(and(eq(followupMessages.kind,"digest"),eq(followupMessages.dedupKey,key),inArray(followupMessages.status,["approved","cancelled"]),isNull(followupMessages.firstAttemptAt)));
 return !!saved;
}
type FailureStage = "startup" | "processing" | "lease_release";
async function recordWorkerFailure(stage: FailureStage, error: unknown) {
 const cause = error instanceof Error ? error.cause : undefined;
 const candidate = cause && typeof cause === "object" && "code" in cause ? cause.code : error && typeof error === "object" && "code" in error ? error.code : undefined;
 const code = typeof candidate === "string" && /^(?:[A-Z0-9]{5}|ERR_[A-Z_]{1,64})$/.test(candidate) ? candidate : "UNKNOWN";
 // Query errors can contain customer data and credentials in their parameters.
 console.error("Orbisy follow-up worker failed", {stage, code});
 try {
  await getDb().insert(followupEvents).values({kind:"worker_error",detail:`Follow-up worker failed during ${stage.replaceAll("_", " ")} (${code}). Saved inquiries are unaffected; review server logs.`});
 } catch {
  console.error("Orbisy follow-up worker error could not be saved", {stage});
 }
}

export async function runFollowupWorker() {
 if (process.env.VERCEL_ENV !== "production") return {status:"disabled_on_this_deployment",sent:0,enrolled:0};
 let lease: string | undefined;
 let claimed = false;
 let stage: FailureStage = "startup";
 let result = {status:"needs_attention",sent:0,enrolled:0};
 try {
  await getFollowupSettings();
  const db = getDb(), now = new Date();
  lease = crypto.randomUUID();
  const [row] = await db.update(followupSettings).set({workerLease:lease,workerLeaseUntil:new Date(now.getTime()+180000),lastWorkerAt:now}).where(and(eq(followupSettings.id,"main"),or(isNull(followupSettings.workerLeaseUntil),lt(followupSettings.workerLeaseUntil,now)))).returning({id:followupSettings.id});
  if (!row) return {status:"already_running",sent:0,enrolled:0};
  claimed = true;
  stage = "processing";
  result = await processFollowupQueue(now);
 } catch (error) {
  await recordWorkerFailure(stage, error);
 } finally {
  if (claimed && lease) {
   try {
    await getDb().update(followupSettings).set({workerLease:null,workerLeaseUntil:null}).where(and(eq(followupSettings.id,"main"),eq(followupSettings.workerLease,lease)));
   } catch (error) {
    await recordWorkerFailure("lease_release", error);
    result = {status:"needs_attention",sent:result.sent,enrolled:result.enrolled};
   }
  }
 }
 return result;
}

async function processFollowupQueue(now: Date) {
 const db = getDb();
 await stopConversationsForLeadChanges();await reconcileDeliveryEvents();const enrolled=await enrollNewInquiries();
 // Recover an interrupted send using the durable marker, never outside the provider's key window.
 await db.update(followupMessages).set({status:"approved",leaseToken:null}).where(and(eq(followupMessages.status,"sending"),sql`${followupMessages.lastAttemptAt}<now()-interval '10 minutes'`,sql`${followupMessages.firstAttemptAt}>now()-interval '23 hours'`));
 await db.update(followupMessages).set({status:"uncertain",leaseToken:null,lastError:"Interrupted send is outside the safe retry window. Check provider logs."}).where(and(eq(followupMessages.status,"sending"),sql`${followupMessages.firstAttemptAt}<=now()-interval '23 hours'`));
 const gmailReady=await syncGmail();
 if(gmailReady)await queueDailyDigest(now);
 if(!outboundEnabled())return {status:"sending_disabled",enrolled,sent:0};
 if(!gmailReady)return {status:"gmail_sync_required",enrolled,sent:0};
 const currentSettings=await getFollowupSettings();
 const eligibleKinds=["acknowledgment",...(withinSendingHours(now)&&currentSettings.digestEnabled?["digest"]:[]),...(withinSendingHours(now)&&mailingConfigurationReady()?["followup_one","followup_two"]:[])];
 const due=await db.select({id:followupMessages.id}).from(followupMessages).where(and(inArray(followupMessages.kind,eligibleKinds),eq(followupMessages.status,"approved"),lte(followupMessages.dueAt,now),or(isNull(followupMessages.nextAttemptAt),lte(followupMessages.nextAttemptAt,now)))).orderBy(sql`CASE ${followupMessages.kind} WHEN 'acknowledgment' THEN 0 WHEN 'digest' THEN 1 WHEN 'followup_one' THEN 2 ELSE 3 END`,asc(followupMessages.dueAt)).limit(3);
 let sent=0;for(const message of due)if(await deliverFollowupMessage(message.id))sent++;return {status:"complete",enrolled,sent};
}
