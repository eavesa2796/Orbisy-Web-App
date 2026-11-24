import "server-only";
import {and,eq,gt,inArray,isNull,ne,notInArray,or,sql} from "drizzle-orm";
import {getDb} from "@/lib/db";
import {leads,followupConversations,outreachSettings,outreachCampaigns,outreachEnrollments,outreachMessages,outreachEvents,suppressionEntries} from "@/lib/db/schema";
import {campaignSchema,prospectSchema,renderOutreach,nextOutreachTime} from "./model";
export type OutreachTx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
export async function getOutreachSettings(){const db=getDb();await db.insert(outreachSettings).values({id:"main"}).onConflictDoNothing();const [settings]=await db.select().from(outreachSettings).where(eq(outreachSettings.id,"main"));return settings;}
export async function lockOutreach(tx:OutreachTx){return (await tx.select().from(outreachSettings).where(eq(outreachSettings.id,"main")).for("update"))[0];}
export async function stopOutreach(tx:OutreachTx,id:string,reason:string,state:"paused"|"replied"|"stopped"="paused",at=new Date()){
 await tx.update(outreachEnrollments).set({state,pauseReason:reason,...(state==="replied"?{replyAt:at}:{}),updatedAt:at}).where(and(eq(outreachEnrollments.id,id),state==="paused"?notInArray(outreachEnrollments.state,["replied","stopped"]):state==="replied"?ne(outreachEnrollments.state,"stopped"):undefined));
 await tx.update(outreachMessages).set({status:"cancelled",lastError:reason}).where(and(eq(outreachMessages.enrollmentId,id),inArray(outreachMessages.status,["draft","approved"])));
}
export async function outreachBlocked(tx:OutreachTx,enrollment:typeof outreachEnrollments.$inferSelect,now=new Date()){
 const [lead]=await tx.select().from(leads).where(eq(leads.id,enrollment.leadId));
 if(!lead||lead.submissionId||!["manually_added","needs_review","qualified","contact_planned","contacted"].includes(lead.status))return "Lead status or an inbound inquiry requires a personal review.";
 if(lead.email?.trim().toLowerCase()!==enrollment.recipientEmail)return "The lead email changed. Review the contact before sending.";
 const [suppressed]=await tx.select({id:suppressionEntries.id}).from(suppressionEntries).where(and(or(eq(suppressionEntries.normalizedEmail,enrollment.recipientEmail),eq(suppressionEntries.normalizedDomain,enrollment.recipientEmail.split("@")[1]),lead.normalizedDomain?eq(suppressionEntries.normalizedDomain,lead.normalizedDomain):undefined,lead.normalizedPhone?eq(suppressionEntries.normalizedPhone,lead.normalizedPhone):undefined,lead.sourceIdentifier?eq(suppressionEntries.normalizedSourceIdentifier,lead.sourceIdentifier):undefined,eq(suppressionEntries.leadId,lead.id)),or(isNull(suppressionEntries.expiresAt),gt(suppressionEntries.expiresAt,now)))).limit(1);
 if(suppressed)return "This contact matches the do-not-contact list.";
 const [inbound]=await tx.select({id:followupConversations.id}).from(followupConversations).where(and(eq(followupConversations.recipientEmail,enrollment.recipientEmail),ne(followupConversations.state,"closed"))).limit(1);
 return inbound?"An inbound conversation is already open for this email address.":null;
}
export async function createOutreachCampaign(input:unknown,actor:string){const data=campaignSchema.parse(input);const [row]=await getDb().insert(outreachCampaigns).values({name:data.name,subject:data.subject,bodies:[data.body0,data.body1,data.body2],createdBy:actor}).returning();return row;}
export async function addOutreachProspect(input:unknown,actor:string){const data=prospectSchema.parse(input);await getOutreachSettings();return getDb().transaction(async tx=>{
 await lockOutreach(tx);
 const [campaign]=await tx.select().from(outreachCampaigns).where(eq(outreachCampaigns.id,data.campaignId));if(!campaign||campaign.status==="archived")throw Error("Choose an available campaign.");
 let leadId=data.leadId;
 if(!leadId){
  const [existing]=await tx.select({id:leads.id}).from(leads).where(sql`lower(${leads.email})=${data.recipientEmail}`).limit(1);
  if(existing)leadId=existing.id;
  else {const [lead]=await tx.insert(leads).values({businessName:data.businessName,contactName:data.recipientName,email:data.recipientEmail,normalizedEmail:data.recipientEmail,normalizedDomain:new URL(data.sourceUrl).hostname.replace(/^www\./,""),sourceName:"Reviewed association outreach",sourceUrl:data.sourceUrl,status:"needs_review"}).returning({id:leads.id});leadId=lead.id;}
 }
 const [enrollment]=await tx.insert(outreachEnrollments).values({...data,leadId}).returning();
 const blocked=await outreachBlocked(tx,enrollment);if(blocked)throw Error(blocked);
 const subject=renderOutreach(campaign.subject,data.recipientName,data.businessName);
 for(let step=0;step<3;step++)await tx.insert(outreachMessages).values({enrollmentId:enrollment.id,step,subject:step?`Re: ${subject}`:subject,body:renderOutreach(campaign.bodies[step],data.recipientName,data.businessName)});
 await tx.insert(outreachEvents).values({enrollmentId:enrollment.id,kind:"prospect_added",detail:`${actor} added a prospect for review. No sending approval granted.`});return enrollment;
 });}
export async function approveOutreachSequence(id:string,input:unknown,actor:string){const data=campaignSchema.omit({name:true}).parse(input);await getOutreachSettings();return getDb().transaction(async tx=>{
 await lockOutreach(tx);const [enrollment]=await tx.select().from(outreachEnrollments).where(eq(outreachEnrollments.id,id)).for("update");if(!enrollment||!["draft","paused"].includes(enrollment.state))return false;
 const rows=await tx.select().from(outreachMessages).where(eq(outreachMessages.enrollmentId,id));if(rows.length!==3||rows.some(m=>m.firstAttemptAt))return false;
 const blocked=await outreachBlocked(tx,enrollment);if(blocked)throw Error(blocked);
 const subject=renderOutreach(data.subject,enrollment.recipientName,enrollment.businessName);if(subject.length>160)throw Error("Shorten the rendered subject to 160 characters.");
 for(const row of rows)await tx.update(outreachMessages).set({subject:row.step?`Re: ${subject}`:subject,body:renderOutreach([data.body0,data.body1,data.body2][row.step],enrollment.recipientName,enrollment.businessName),status:"approved",dueAt:row.step===0?nextOutreachTime(new Date()):null,lastError:null}).where(eq(outreachMessages.id,row.id));
 await tx.update(outreachEnrollments).set({state:"approved",approvedAt:new Date(),approvedBy:actor,pauseReason:null,updatedAt:new Date()}).where(eq(outreachEnrollments.id,id));
 await tx.insert(outreachEvents).values({enrollmentId:id,kind:"sequence_approved",detail:`${actor} reviewed this contact and all three messages. Campaign and mailbox sending controls still apply.`});return true;
 });}
export async function pauseOutreach(id:string,actor:string){await getOutreachSettings();await getDb().transaction(async tx=>{await lockOutreach(tx);await stopOutreach(tx,id,"Paused by the administrator.");await tx.insert(outreachEvents).values({enrollmentId:id,kind:"paused",detail:`${actor} paused this sequence. An in-flight email cannot be recalled.`});});}
