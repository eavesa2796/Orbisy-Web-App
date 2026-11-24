import "server-only";
import {and,eq,inArray,ne} from "drizzle-orm";
import {getDb} from "@/lib/db";
import {leads,outreachSettings,outreachEnrollments,outreachMessages,outreachEvents} from "@/lib/db/schema";
import {encryptGmailToken,decryptGmailToken,googleTokenRequest,gmailGet,mailboxAddresses,type GmailMetadata} from "@/lib/followups/gmail";
import {getOutreachSettings,lockOutreach,stopOutreach} from "./service";
export const OUTREACH_SCOPES=["https://www.googleapis.com/auth/gmail.metadata","https://www.googleapis.com/auth/gmail.send"];
export const OUTREACH_MAILBOX="info@orbisy.com";
export function messageIdentity(id:string){return `<orbisy-outreach-${id}@orbisy.com>`;}
export async function connectOutreachMailbox(refreshToken:string,accessToken:string){
 const profile=await gmailGet("profile",accessToken) as {emailAddress:string;historyId:string};if(profile.emailAddress?.toLowerCase()!==OUTREACH_MAILBOX||!/^\d{1,120}$/.test(profile.historyId))throw Error("WRONG_MAILBOX");
 await getOutreachSettings();await getDb().transaction(async tx=>{await lockOutreach(tx);const rows=await tx.select({id:outreachEnrollments.id}).from(outreachEnrollments).where(eq(outreachEnrollments.state,"approved"));for(const row of rows)await stopOutreach(tx,row.id,"Outreach mailbox reconnected. Review the sequence before any further sending.");await tx.update(outreachSettings).set({gmailTokenCiphertext:encryptGmailToken(refreshToken),gmailCursor:profile.historyId,gmailPageToken:null,gmailSyncedAt:new Date(),gmailError:null,sendingEnabled:false,updatedAt:new Date()}).where(eq(outreachSettings.id,"main"));});
}
export async function disconnectOutreachMailbox(){await getDb().transaction(async tx=>{await lockOutreach(tx);for(const row of await tx.select({id:outreachEnrollments.id}).from(outreachEnrollments).where(eq(outreachEnrollments.state,"approved")))await stopOutreach(tx,row.id,"Outreach mailbox disconnected.");await tx.update(outreachSettings).set({gmailTokenCiphertext:null,gmailCursor:null,gmailPageToken:null,gmailSyncedAt:null,gmailError:null,sendingEnabled:false}).where(eq(outreachSettings.id,"main"));});
 // Do not revoke the shared Google OAuth client grant: that would also revoke the inbound mailbox connection.
}
export async function outreachAccessToken(){const settings=await getOutreachSettings();if(!settings.gmailTokenCiphertext)throw Error("OUTREACH_MAILBOX_NOT_CONNECTED");const token=await googleTokenRequest({grant_type:"refresh_token",refresh_token:decryptGmailToken(settings.gmailTokenCiphertext)});const profile=await gmailGet("profile",token.access_token) as {emailAddress:string};if(profile.emailAddress?.toLowerCase()!==OUTREACH_MAILBOX)throw Error("WRONG_OUTREACH_MAILBOX");return token.access_token;}
export async function applyOutreachMetadata(message:GmailMetadata & {threadId?:string}){
 const headers=message.payload?.headers||[];const read=(name:string)=>headers.filter(h=>h.name.toLowerCase()===name).map(h=>h.value).join(",");const from=mailboxAddresses(read("from")),to=mailboxAddresses([read("to"),read("cc"),read("bcc")].join(","));const sent=!!message.labelIds?.includes("SENT")&&from.includes(OUTREACH_MAILBOX);
 const failedRecipients=mailboxAddresses(read("x-failed-recipients"));const deliveryNotice=failedRecipients.length>0||/mailer-daemon|postmaster/i.test(read("from"));const notification=deliveryNotice||!!read("auto-submitted")&&read("auto-submitted").toLowerCase()!=="no";
 const at=new Date(Number(message.internalDate));if(!Number.isFinite(at.getTime()))throw Error("INVALID_OUTREACH_MESSAGE_DATE");
 await getDb().transaction(async tx=>{
  const enrollments=await tx.select().from(outreachEnrollments).where(ne(outreachEnrollments.state,"stopped"));let matched=false;
  for(const enrollment of enrollments){
   const messages=await tx.select().from(outreachMessages).where(eq(outreachMessages.enrollmentId,enrollment.id));
   const start=enrollment.firstSentAt||messages.find(m=>m.step===0)?.firstAttemptAt;
   if(!start||at<start||(enrollment.replyAt&&at<=enrollment.replyAt))continue;
   const own=messages.find(m=>read("message-id").trim()===messageIdentity(m.id)||m.providerId===message.id);
   if(sent&&own){
    if(["sending","uncertain"].includes(own.status))await tx.update(outreachMessages).set({status:"sent",sentAt:at,providerId:message.id,threadId:message.threadId||null,lastError:"Gmail Sent metadata confirmed this previously uncertain attempt. Review the paused sequence before continuing."}).where(eq(outreachMessages.id,own.id));
    continue;
   }
   const references=read("in-reply-to")+" "+read("references");const linked=messages.some(m=>!!m.firstAttemptAt&&(references.includes(messageIdentity(m.id))||(message.threadId&&m.threadId===message.threadId)));
   if(!(sent?to:from).includes(enrollment.recipientEmail)&&!linked&&!failedRecipients.includes(enrollment.recipientEmail))continue;matched=true;
   const [event]=await tx.insert(outreachEvents).values({enrollmentId:enrollment.id,externalKey:`gmail:${message.id}:${enrollment.id}`,kind:sent?"personal_message":notification?"mailbox_notification":"reply_detected",detail:sent?"A personal Gmail message stopped the automated outreach sequence.":notification?"A delivery or automatic mailbox notification paused this sequence. Review it in Gmail; this is not counted as a human reply.":"An incoming reply stopped outreach. Review the message in Gmail.",occurredAt:at}).onConflictDoNothing().returning({id:outreachEvents.id});if(!event)continue;
   await stopOutreach(tx,enrollment.id,sent?"A personal Gmail message was detected.":notification?"A delivery or automatic mailbox notification needs review.":"A reply was detected.",sent||notification?"paused":"replied",at);
   if(!sent&&!notification)await tx.update(leads).set({status:"replied",updatedAt:at}).where(and(eq(leads.id,enrollment.leadId),inArray(leads.status,["needs_review","manually_added","qualified","contact_planned","contacted"])));
  }
  if(deliveryNotice&&!sent&&!matched){await tx.update(outreachSettings).set({sendingEnabled:false,gmailError:"An unmatched delivery notification needs a Gmail review. Outreach sending was paused."}).where(eq(outreachSettings.id,"main"));await tx.insert(outreachEvents).values({externalKey:`delivery-review:${message.id}`,kind:"delivery_review",detail:"A delivery notification could not be matched safely using headers. Outreach sending paused for administrator review.",occurredAt:at}).onConflictDoNothing();}
 });
}
export async function syncOutreachMailbox(accessToken:string){const settings=await getOutreachSettings();if(!settings.gmailCursor)return false;try{
 let pageToken=settings.gmailPageToken||undefined;
 // Continue a backlog across runs, and keep sending blocked until fully caught up.
 const params=new URLSearchParams({startHistoryId:settings.gmailCursor,historyTypes:"messageAdded",maxResults:"20"});if(pageToken)params.set("pageToken",pageToken);
 const history=await gmailGet(`history?${params}`,accessToken) as {history?:Array<{messagesAdded?:Array<{message:{id:string}}>}>;historyId:string;nextPageToken?:string};
 if(!/^\d{1,120}$/.test(history.historyId))throw Error("INVALID_OUTREACH_HISTORY");
 const ids=[...new Set((history.history||[]).flatMap(h=>(h.messagesAdded||[]).map(m=>m.message.id)))];if(ids.length>100)throw Error("OUTREACH_BACKLOG");
 for(let i=0;i<ids.length;i+=5){const metadata=await Promise.all(ids.slice(i,i+5).map(id=>{const query=new URLSearchParams({format:"metadata"});for(const header of ["From","To","Cc","Bcc","Message-ID","In-Reply-To","References","Auto-Submitted","X-Failed-Recipients"])query.append("metadataHeaders",header);return gmailGet(`messages/${encodeURIComponent(id)}?${query}`,accessToken) as Promise<GmailMetadata & {threadId?:string}>;}));for(const message of metadata)await applyOutreachMetadata(message);}
 pageToken=history.nextPageToken;
 await getDb().update(outreachSettings).set({gmailPageToken:pageToken||null,...(!pageToken?{gmailCursor:history.historyId,gmailSyncedAt:new Date(),gmailError:null}:{gmailError:"Mailbox history is catching up. Sending is paused."})}).where(eq(outreachSettings.id,"main"));return !pageToken;
 }catch{await getDb().update(outreachSettings).set({gmailError:"Outreach mailbox sync needs attention. Reconnect if necessary; sending is blocked."}).where(eq(outreachSettings.id,"main"));return false;}}
