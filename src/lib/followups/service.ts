import "server-only";
import {and,eq,gt,gte,inArray,isNull,ne,or,sql} from "drizzle-orm";
import {getDb} from "@/lib/db";
import {contactSubmissions,leads,suppressionEntries,followupSettings,followupConversations,followupMessages,followupEvents,pipelineEvents,manualContactAttempts} from "@/lib/db/schema";
import {afterBusinessDays,defaultTemplates,FOLLOWUP_MAILBOX,renderTemplate,templatesSchema} from "./model";
export type FollowupTx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
export async function getFollowupSettings(){const db=getDb();await db.insert(followupSettings).values({id:"main",templates:defaultTemplates}).onConflictDoNothing();const [settings]=await db.select().from(followupSettings).where(eq(followupSettings.id,"main"));return {...settings,templates:templatesSchema.safeParse(settings.templates).success?settings.templates:defaultTemplates};}
export async function isSuppressed(tx:FollowupTx,email:string,leadId:string,now=new Date()){
 const [match]=await tx.select({id:suppressionEntries.id}).from(suppressionEntries).where(and(or(eq(suppressionEntries.normalizedEmail,email),eq(suppressionEntries.normalizedDomain,email.split("@")[1]),eq(suppressionEntries.leadId,leadId)),or(isNull(suppressionEntries.expiresAt),gt(suppressionEntries.expiresAt,now)))).limit(1);return !!match;
}
export async function pauseConversation(tx:FollowupTx,id:string,reason:string,at=new Date(),externalKey?:string,reply=false){
 const [existing]=await tx.select().from(followupConversations).where(eq(followupConversations.id,id)).for("update");if(!existing)return;
 if(externalKey){const [event]=await tx.insert(followupEvents).values({conversationId:id,kind:reply?"reply_detected":"personal_response_detected",detail:reason,externalKey,occurredAt:at}).onConflictDoNothing().returning({id:followupEvents.id});if(!event)return;}
 else await tx.insert(followupEvents).values({conversationId:id,kind:"paused",detail:reason,occurredAt:at});
 if(reply&&existing.state!=="closed"){
  const [lead]=await tx.select().from(leads).where(eq(leads.id,existing.leadId));
  if(lead&&["new_inbound","qualified","contact_planned","contacted"].includes(lead.status)){
   await tx.update(leads).set({status:"replied",updatedAt:new Date()}).where(eq(leads.id,lead.id));
   await tx.insert(pipelineEvents).values({leadId:lead.id,fromStatus:lead.status,toStatus:"replied",note:"Reply recorded by the inbound follow-up workflow; review the conversation personally."});
  }
 }
 if(existing.state!=="closed")await tx.update(followupConversations).set({state:"paused",pauseReason:reason,...(reply?{replyAt:at}:{}),updatedAt:new Date()}).where(eq(followupConversations.id,id));
 await tx.update(followupMessages).set({status:"cancelled",lastError:reason}).where(and(eq(followupMessages.conversationId,id),inArray(followupMessages.status,["draft","approved","failed"])));
}
export async function enrollInquiry(leadId:string,actor:string,automatic=false){
 const settings=await getFollowupSettings();
 return getDb().transaction(async tx=>{
 const [row]=await tx.select({lead:leads,submission:contactSubmissions}).from(leads).innerJoin(contactSubmissions,eq(leads.submissionId,contactSubmissions.id)).where(eq(leads.id,leadId)).for("update");
 if(!row||!["new_inbound","qualified"].includes(row.lead.status))return false;
 const email=row.submission.email.trim().toLowerCase();if(email===FOLLOWUP_MAILBOX||await isSuppressed(tx,email,leadId))return false;
 const [conversation]=await tx.insert(followupConversations).values({submissionId:row.submission.id,leadId,recipientEmail:email,recipientName:row.submission.name}).onConflictDoNothing().returning();if(!conversation)return false;
 const message=renderTemplate(settings.templates.acknowledgment,row.submission.name);
 await tx.insert(followupMessages).values({conversationId:conversation.id,dedupKey:`${conversation.id}:acknowledgment`,kind:"acknowledgment",recipientEmail:email,...message,dueAt:new Date(),...(automatic&&settings.autoAcknowledge&&row.submission.submittedAt.getTime()>=Date.now()-15*60000?{status:"approved",approvedAt:new Date(),approvedBy:"Reviewed acknowledgment template"}:{})});
 await tx.insert(followupEvents).values({conversationId:conversation.id,kind:"enrolled",detail:`Inquiry enrolled by ${actor}. Acknowledgment ${automatic&&settings.autoAcknowledge&&row.submission.submittedAt.getTime()>=Date.now()-15*60000?"approved by template setting":"awaits review"}.`});return true;
 });
}
export async function enrollNewInquiries(){const settings=await getFollowupSettings();if(!settings.enrollmentEnabled||!settings.activatedAt)return 0;
 const rows=await getDb().select({id:leads.id}).from(leads).innerJoin(contactSubmissions,eq(leads.submissionId,contactSubmissions.id)).leftJoin(followupConversations,eq(followupConversations.submissionId,contactSubmissions.id)).where(and(gte(contactSubmissions.submittedAt,settings.activatedAt),isNull(followupConversations.id),eq(leads.status,"new_inbound"),sql`NOT EXISTS (SELECT 1 FROM followup_conversations fc WHERE fc.recipient_email=lower(${contactSubmissions.email}) AND fc.state <> 'closed')`)).orderBy(contactSubmissions.submittedAt).limit(50);let count=0;for(const row of rows)if(await enrollInquiry(row.id,"new-inquiry worker",true))count++;return count;
}
export async function recordPersonalResponse(id:string,actor:string){const settings=await getFollowupSettings();const at=new Date();return getDb().transaction(async tx=>{
 const [conversation]=await tx.select().from(followupConversations).where(eq(followupConversations.id,id)).for("update");if(!conversation||conversation.personalResponseAt||conversation.state==="closed")return false;
 if(await isSuppressed(tx,conversation.recipientEmail,conversation.leadId))return false;
 const [lead]=await tx.select().from(leads).where(eq(leads.id,conversation.leadId));
 if(!lead||!["new_inbound","qualified","contact_planned","contacted","replied"].includes(lead.status))return false;
 if(lead.status!=="contacted"){
  await tx.update(leads).set({status:"contacted",updatedAt:at}).where(eq(leads.id,lead.id));
  await tx.insert(pipelineEvents).values({leadId:lead.id,fromStatus:lead.status,toStatus:"contacted",note:"Personal email response confirmed in the follow-up inbox."});
 }
 await tx.insert(manualContactAttempts).values({leadId:lead.id,channel:"email",contactedAt:at,notes:`Personal response confirmed by ${actor} in the follow-up inbox.`});
 await tx.update(followupConversations).set({state:"waiting_reply",personalResponseAt:at,pauseReason:null,replyAt:null,updatedAt:at}).where(eq(followupConversations.id,id));
 await tx.update(followupMessages).set({status:"cancelled",lastError:"Personal response already sent."}).where(and(eq(followupMessages.conversationId,id),inArray(followupMessages.status,["draft","approved"]),eq(followupMessages.kind,"acknowledgment")));
 for(const [kind,days] of [["followup_one",2],["followup_two",7]] as const){const message=renderTemplate(settings.templates[kind],conversation.recipientName);await tx.insert(followupMessages).values({conversationId:id,dedupKey:`${id}:${kind}`,kind,recipientEmail:conversation.recipientEmail,...message,dueAt:afterBusinessDays(at,days)}).onConflictDoNothing();}
 await tx.insert(followupEvents).values({conversationId:id,kind:"personal_response_recorded",detail:`${actor} confirmed a personal response was sent. Two drafts prepared; neither is approved automatically.`,occurredAt:at});return true;
 });}
export async function stopConversationsForLeadChanges(){return getDb().transaction(async tx=>{const rows=await tx.select({conversation:followupConversations,status:leads.status}).from(followupConversations).innerJoin(leads,eq(followupConversations.leadId,leads.id)).where(and(ne(followupConversations.state,"closed"),inArray(leads.status,["replied","consultation","proposal_sent","won","lost","suppressed"])));for(const row of rows)if(row.conversation.state!=="paused")await pauseConversation(tx,row.conversation.id,`Lead moved to ${row.status.replaceAll("_"," ")}. Review personally before any further follow-up.`);return rows.length;});}
