import "server-only";
import {and,eq,inArray,isNull} from "drizzle-orm";
import {getDb} from "@/lib/db";
import {followupMessages,followupEvents,followupConversations,followupSettings,leads,suppressionEntries} from "@/lib/db/schema";
import {FOLLOWUP_MAILBOX,outboundEnabled,withinSendingHours,afterBusinessDays} from "./model";
import {isSuppressed,pauseConversation} from "./service";
import {mailingConfigurationReady,unsubscribeUrl,resendWebhookConfigured} from "./security";
import {dailyDigestKey,digestWindowOpen,loadDigestSnapshot,renderDailyDigest} from "./digest";
import {renderBrandedEmail} from "@/lib/email-brand";
export async function reconcileDeliveryEvents(){const db=getDb();const rows=await db.select({event:followupEvents,message:followupMessages}).from(followupEvents).innerJoin(followupMessages,eq(followupEvents.providerEmailId,followupMessages.providerId)).where(isNull(followupEvents.messageId)).limit(100);
 for(const {event,message} of rows)await db.transaction(async tx=>{
 if(message.conversationId)await tx.select({id:followupConversations.id}).from(followupConversations).where(eq(followupConversations.id,message.conversationId)).for("update");
 await tx.select({id:followupMessages.id}).from(followupMessages).where(eq(followupMessages.id,message.id)).for("update");
 const [claimed]=await tx.update(followupEvents).set({messageId:message.id,conversationId:message.conversationId}).where(and(eq(followupEvents.id,event.id),isNull(followupEvents.messageId))).returning({id:followupEvents.id});if(!claimed)return;
 if(event.kind==="email.delivered")await tx.update(followupMessages).set({status:"delivered"}).where(and(eq(followupMessages.id,message.id),inArray(followupMessages.status,["accepted","sending"])));
 if(["email.bounced","email.complained","email.failed"].includes(event.kind)){
 await tx.update(followupMessages).set({status:"failed",lastError:event.kind}).where(eq(followupMessages.id,message.id));
 if(message.conversationId)await pauseConversation(tx,message.conversationId,`Delivery needs attention: ${event.kind}.`);
 if(event.kind!=="email.failed")await tx.insert(suppressionEntries).values({normalizedEmail:message.recipientEmail,type:"email",source:"Follow-up delivery event",reason:event.kind});
 }
 });
}
export async function deliverFollowupMessage(id:string){
 if(!outboundEnabled()||!process.env.RESEND_API_KEY||!process.env.RESEND_FROM_EMAIL||!resendWebhookConfigured())return false;
 const now=new Date(),lease=crypto.randomUUID();
 const claimed=await getDb().transaction(async tx=>{
 const [settings]=await tx.select().from(followupSettings).where(eq(followupSettings.id,"main")).for("update");
 if(!settings?.sendingEnabled||!settings.gmailTokenCiphertext||settings.gmailError||settings.gmailPageToken||!settings.gmailSyncedAt||now.getTime()-settings.gmailSyncedAt.getTime()>120000)return null;
 const [initial]=await tx.select().from(followupMessages).where(eq(followupMessages.id,id));if(!initial)return null;
 const [conversation]=initial.conversationId?await tx.select().from(followupConversations).where(eq(followupConversations.id,initial.conversationId)).for("update"):[];
 const [message]=await tx.select().from(followupMessages).where(eq(followupMessages.id,id)).for("update");
 if(!message||message.status!=="approved"||!message.approvedAt||message.dueAt>now||(message.nextAttemptAt&&message.nextAttemptAt>now))return null;
 if(message.kind!=="acknowledgment"&&!withinSendingHours(now))return null;
 if(message.kind==="digest"&&(!settings.digestEnabled||!digestWindowOpen(now,settings.digestHour)||message.dedupKey!==dailyDigestKey(now)))return null;
 const isFollowup=message.kind==="followup_one"||message.kind==="followup_two";
 if(isFollowup&&!mailingConfigurationReady())return null;
 if(message.kind!=="digest"){
 if(!conversation||conversation.replyAt||["paused","closed"].includes(conversation.state))return null;
 const [lead]=await tx.select().from(leads).where(eq(leads.id,conversation.leadId));
 if(!lead||!["new_inbound","qualified","contact_planned","contacted"].includes(lead.status)||await isSuppressed(tx,message.recipientEmail,conversation.leadId,now)){await pauseConversation(tx,conversation.id,"Lead status or suppression stopped this message.");return null;}
 if(message.kind==="acknowledgment"&&conversation.personalResponseAt)return null;
 if(isFollowup&&(!conversation.personalResponseAt||conversation.state!=="waiting_reply"))return null;
 if(message.kind==="followup_two"){const [first]=await tx.select().from(followupMessages).where(and(eq(followupMessages.conversationId,conversation.id),eq(followupMessages.kind,"followup_one")));if(!first?.acceptedAt||now<afterBusinessDays(first.acceptedAt,5))return null;}
 }
 if(message.firstAttemptAt&&now.getTime()-message.firstAttemptAt.getTime()>23*3600000){await tx.update(followupMessages).set({status:"uncertain",lastError:"The deduplication window is ending. Check the provider log; do not resend blindly."}).where(eq(followupMessages.id,id));return null;}
 let messageBody=message.body;
 if(message.kind==="digest"&&!message.firstAttemptAt){
  const snapshot=await loadDigestSnapshot(tx,now);
  if(!snapshot.hasActions){await tx.update(followupMessages).set({status:"cancelled",lastError:"No follow-up actions need attention; empty daily digest skipped."}).where(eq(followupMessages.id,id));return null;}
  messageBody=renderDailyDigest(snapshot,now);
 }
 const stopUrl=message.kind!=="digest"&&mailingConfigurationReady()?unsubscribeUrl(message.conversationId!):null;
 const payload=message.deliveryPayload||{from:process.env.RESEND_FROM_EMAIL,to:[message.recipientEmail],reply_to:FOLLOWUP_MAILBOX,subject:message.subject,...renderBrandedEmail({subject:message.subject,body:messageBody,postalAddress:process.env.FOLLOWUP_POSTAL_ADDRESS,stopUrl}),...(stopUrl?{headers:{"List-Unsubscribe":`<${stopUrl}>`,"List-Unsubscribe-Post":"List-Unsubscribe=One-Click"}}:{})};
 const [saved]=await tx.update(followupMessages).set({body:messageBody,status:"sending",attempts:message.attempts+1,firstAttemptAt:message.firstAttemptAt||now,lastAttemptAt:now,leaseToken:lease,deliveryPayload:payload}).where(eq(followupMessages.id,id)).returning();return saved;
 });
 if(!claimed)return false;
 const owns=and(eq(followupMessages.id,id),eq(followupMessages.leaseToken,lease),eq(followupMessages.status,"sending"));
 // The durable first-attempt marker and immutable payload commit BEFORE the external API call.
 try{
 const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json","Idempotency-Key":`orbisy-followup-${id}`},body:JSON.stringify(claimed.deliveryPayload),signal:AbortSignal.timeout(8000)});
 if(!response.ok){const retry=(response.status===429||response.status>=500)&&claimed.attempts<5;await getDb().update(followupMessages).set({status:retry?"approved":"failed",lastError:`Email provider returned HTTP ${response.status}.`,leaseToken:null,nextAttemptAt:retry?new Date(now.getTime()+Math.min(60,5*2**(claimed.attempts-1))*60000):null}).where(owns);return false;}
 const data=await response.json() as {id?:string};if(!data.id||data.id.length>120)throw Error("NO_PROVIDER_ID");
 await getDb().transaction(async tx=>{const [saved]=await tx.update(followupMessages).set({status:"accepted",providerId:data.id,acceptedAt:new Date(),lastError:null,nextAttemptAt:null,leaseToken:null}).where(owns).returning({id:followupMessages.id});if(!saved)return;await tx.insert(followupEvents).values({conversationId:claimed.conversationId,messageId:id,kind:"email_accepted",detail:"Email provider accepted this message. This is not proof of inbox delivery."});if(claimed.kind==="followup_two"&&claimed.conversationId)await tx.update(followupConversations).set({state:"paused",pauseReason:"The two-message sequence is complete. Continue personally if the contact replies."}).where(and(eq(followupConversations.id,claimed.conversationId),eq(followupConversations.state,"waiting_reply")));});
 await reconcileDeliveryEvents();return true;
 }catch{await getDb().update(followupMessages).set({status:claimed.attempts<5?"approved":"uncertain",lastError:"Provider response was uncertain. A stable payload/key permits retries only within 23 hours.",leaseToken:null,nextAttemptAt:new Date(now.getTime()+Math.min(60,5*2**(claimed.attempts-1))*60000)}).where(owns);return false;}
}
