import "server-only";
import {and,asc,eq,isNull,lt,lte,or,sql} from "drizzle-orm";
import {getDb} from "@/lib/db";
import {leads,pipelineEvents,outreachSettings,outreachCampaigns,outreachEnrollments,outreachMessages,outreachEvents} from "@/lib/db/schema";
import {gmailConfigurationReady} from "@/lib/followups/gmail";
import {mailingConfigurationReady} from "@/lib/followups/security";
import {chicagoParts} from "@/lib/followups/model";
import {renderBrandedEmail} from "@/lib/email-brand";
import {outreachEnabled,isOutreachTime,afterOutreachDays} from "./model";
import {getOutreachSettings,lockOutreach,outreachBlocked,stopOutreach} from "./service";
import {outreachAccessToken,syncOutreachMailbox,OUTREACH_MAILBOX,messageIdentity} from "./gmail";
import {outreachStopUrl} from "./security";
const encode=(value:string)=>Buffer.from(value,"utf8").toString("base64").match(/.{1,76}/g)?.join("\r\n")||"";
function encodedSubject(value:string){const parts:string[]=[];let part="";for(const character of value){if(Buffer.byteLength(part+character,"utf8")>39){parts.push(part);part="";}part+=character;}if(part)parts.push(part);return parts.map(text=>`=?UTF-8?B?${Buffer.from(text).toString("base64")}?=`).join("\r\n ");}
export function outreachMime(message:typeof outreachMessages.$inferSelect,email:string,stopUrl:string,previous?:typeof outreachMessages.$inferSelect){
 if(/[\r\n]/.test(email+message.subject))throw Error("INVALID_EMAIL_HEADER");
 const content=renderBrandedEmail({subject:message.subject,body:message.body,postalAddress:process.env.FOLLOWUP_POSTAL_ADDRESS,stopUrl,preferencePath:"/outreach-preferences",commercial:true});
 const boundary=`orbisy-${message.id}`;
 const headers=[`From: Orbisy <${OUTREACH_MAILBOX}>`,`To: ${email}`,`Reply-To: ${OUTREACH_MAILBOX}`,`Subject: ${encodedSubject(message.subject)}`,`Date: ${new Date().toUTCString()}`,`Message-ID: ${messageIdentity(message.id)}`,"MIME-Version: 1.0",`List-Unsubscribe: <${stopUrl}>`,"List-Unsubscribe-Post: List-Unsubscribe=One-Click",`Content-Type: multipart/alternative; boundary="${boundary}"`,...(previous?[`In-Reply-To: ${messageIdentity(previous.id)}`,`References: ${messageIdentity(previous.id)}`]:[])];
 const raw=[...headers,"",`--${boundary}`,"Content-Type: text/plain; charset=UTF-8","Content-Transfer-Encoding: base64","",encode(content.text),`--${boundary}`,"Content-Type: text/html; charset=UTF-8","Content-Transfer-Encoding: base64","",encode(content.html),`--${boundary}--`,""].join("\r\n");
 return Buffer.from(raw,"utf8").toString("base64url");
}
export async function dispatchOutreach(accessToken:string){
 if(!outreachEnabled()||!gmailConfigurationReady()||!mailingConfigurationReady())return false;
 const now=new Date();if(!isOutreachTime(now))return false;
 const claimed=await getDb().transaction(async tx=>{
  const settings=await lockOutreach(tx);if(!settings?.sendingEnabled||!settings.policyReviewedAt||!settings.gmailTokenCiphertext||settings.gmailError||settings.gmailPageToken||!settings.gmailSyncedAt||now.getTime()-settings.gmailSyncedAt.getTime()>120000)return null;
  if(settings.lastDispatchAt&&now.getTime()-settings.lastDispatchAt.getTime()<10*60000)return null;
  const [counts]=await tx.select({count:sql<number>`count(*)`}).from(outreachMessages).where(sql`(${outreachMessages.firstAttemptAt} AT TIME ZONE 'America/Chicago')::date=${chicagoParts(now).date}::date`);
  if(Number(counts.count)>=settings.dailyLimit)return null;
  const candidates=await tx.select({message:outreachMessages,enrollment:outreachEnrollments,campaign:outreachCampaigns}).from(outreachMessages).innerJoin(outreachEnrollments,eq(outreachMessages.enrollmentId,outreachEnrollments.id)).innerJoin(outreachCampaigns,eq(outreachEnrollments.campaignId,outreachCampaigns.id)).where(and(eq(outreachMessages.status,"approved"),lte(outreachMessages.dueAt,now),eq(outreachEnrollments.state,"approved"),eq(outreachCampaigns.status,"active"),isNull(outreachMessages.firstAttemptAt))).orderBy(asc(outreachMessages.dueAt)).limit(20);
  for(const {message,enrollment} of candidates){
   const blocked=enrollment.approvedAt&&now.getTime()-enrollment.approvedAt.getTime()>30*86400000?"The sequence approval is over 30 days old. Review the conversation personally.":await outreachBlocked(tx,enrollment,now);if(blocked){await stopOutreach(tx,enrollment.id,blocked);continue;}
   if(!enrollment.approvedAt||!enrollment.approvedBy||enrollment.replyAt)continue;
   const [previous]=message.step?await tx.select().from(outreachMessages).where(and(eq(outreachMessages.enrollmentId,enrollment.id),eq(outreachMessages.step,message.step-1))):[];
   if(message.step&&(!previous?.sentAt||previous.status!=="sent"||now<afterOutreachDays(previous.sentAt,message.step===1?3:4)))continue;
   const mimeRaw=outreachMime(message,enrollment.recipientEmail,outreachStopUrl(enrollment.id),previous);
   const [saved]=await tx.update(outreachMessages).set({status:"sending",firstAttemptAt:now,mimeRaw,lastError:null}).where(and(eq(outreachMessages.id,message.id),eq(outreachMessages.status,"approved"),isNull(outreachMessages.firstAttemptAt))).returning();if(!saved)continue;
   await tx.update(outreachSettings).set({lastDispatchAt:now}).where(eq(outreachSettings.id,"main"));return {message:saved,enrollment,threadId:previous?.threadId};
  }return null;
 });
 if(!claimed)return false;
 try{
  const response=await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send",{method:"POST",headers:{Authorization:`Bearer ${accessToken}`,"Content-Type":"application/json"},body:JSON.stringify({raw:claimed.message.mimeRaw,...(claimed.threadId?{threadId:claimed.threadId}:{})}),signal:AbortSignal.timeout(8000),cache:"no-store"});
  if(!response.ok){await failAttempt(claimed.message.id,claimed.enrollment.id,`Gmail returned HTTP ${response.status}. Review before sending anything else.`,response.status>=500);return false;}
  const result=await response.json() as {id?:string;threadId?:string};if(!result.id||result.id.length>120||!result.threadId||result.threadId.length>120)throw Error("UNCERTAIN_GMAIL_RESPONSE");
  await getDb().transaction(async tx=>{
   await lockOutreach(tx);const [saved]=await tx.update(outreachMessages).set({status:"sent",providerId:result.id,threadId:result.threadId,sentAt:new Date()}).where(and(eq(outreachMessages.id,claimed.message.id),eq(outreachMessages.status,"sending"))).returning();if(!saved)return;
   await tx.update(outreachEnrollments).set({firstSentAt:claimed.enrollment.firstSentAt||now,updatedAt:now,...(saved.step===2?{state:"completed"}: {})}).where(and(eq(outreachEnrollments.id,claimed.enrollment.id),eq(outreachEnrollments.state,"approved")));
   if(saved.step<2)await tx.update(outreachMessages).set({dueAt:afterOutreachDays(now,saved.step===0?3:4)}).where(and(eq(outreachMessages.enrollmentId,claimed.enrollment.id),eq(outreachMessages.step,saved.step+1),eq(outreachMessages.status,"approved")));
   if(saved.step===0){const [lead]=await tx.select().from(leads).where(eq(leads.id,claimed.enrollment.leadId));if(lead&&["needs_review","manually_added","qualified","contact_planned"].includes(lead.status)){await tx.update(leads).set({status:"contacted",updatedAt:now}).where(eq(leads.id,lead.id));await tx.insert(pipelineEvents).values({leadId:lead.id,fromStatus:lead.status,toStatus:"contacted",note:"Reviewed introduction accepted by Gmail; inbox delivery is not confirmed."});}}
   await tx.insert(outreachEvents).values({enrollmentId:claimed.enrollment.id,messageId:saved.id,kind:"sent",detail:`Gmail accepted message ${saved.step+1} of 3. This is not proof of inbox delivery.`});
  });return true;
 }catch{await failAttempt(claimed.message.id,claimed.enrollment.id,"Send outcome is uncertain. Check Gmail Sent before any further contact; this message will not retry automatically.",true);return false;}
}
async function failAttempt(id:string,enrollmentId:string,reason:string,uncertain:boolean){await getDb().transaction(async tx=>{await lockOutreach(tx);await tx.update(outreachMessages).set({status:uncertain?"uncertain":"failed",lastError:reason}).where(and(eq(outreachMessages.id,id),eq(outreachMessages.status,"sending")));await stopOutreach(tx,enrollmentId,reason);await tx.insert(outreachEvents).values({enrollmentId,messageId:id,kind:uncertain?"uncertain":"failed",detail:reason});});}
export async function runOutreachWorker(){
 if(!outreachEnabled())return {status:"disabled",sent:0};
 await getOutreachSettings();const lease=crypto.randomUUID(),now=new Date();
 const [claimed]=await getDb().update(outreachSettings).set({workerLease:lease,workerLeaseUntil:new Date(now.getTime()+180000),lastWorkerAt:now}).where(and(eq(outreachSettings.id,"main"),or(isNull(outreachSettings.workerLeaseUntil),lt(outreachSettings.workerLeaseUntil,now)))).returning({id:outreachSettings.id});
 if(!claimed)return {status:"already_running",sent:0};
 try{
  const interrupted=await getDb().select().from(outreachMessages).where(and(eq(outreachMessages.status,"sending"),lt(outreachMessages.firstAttemptAt,new Date(now.getTime()-180000))));for(const m of interrupted)await failAttempt(m.id,m.enrollmentId,"An interrupted send needs a Gmail Sent review. No automatic retry.",true);
  const settings=await getOutreachSettings();if(!settings.gmailTokenCiphertext)return {status:"not_connected",sent:0};
  const token=await outreachAccessToken();if(!await syncOutreachMailbox(token))return {status:"needs_attention",sent:0};
  if(!settings.sendingEnabled)return {status:"paused",sent:0};
  return {status:"complete",sent:await dispatchOutreach(token)?1:0};
 }catch{
  await getDb().update(outreachSettings).set({gmailError:"Outreach worker needs attention. Check the mailbox connection; sending is blocked."}).where(eq(outreachSettings.id,"main"));
  return {status:"needs_attention",sent:0};
 }finally{await getDb().update(outreachSettings).set({workerLease:null,workerLeaseUntil:null}).where(and(eq(outreachSettings.id,"main"),eq(outreachSettings.workerLease,lease)));}
}
