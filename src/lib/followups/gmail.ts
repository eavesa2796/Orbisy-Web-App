import "server-only";
import {createCipheriv,createDecipheriv,randomBytes} from "node:crypto";
import {eq,ne} from "drizzle-orm";
import {getDb} from "@/lib/db";
import {followupSettings,followupConversations,contactSubmissions} from "@/lib/db/schema";
import {FOLLOWUP_MAILBOX} from "./model";
import {getFollowupSettings,pauseConversation} from "./service";
export const GMAIL_SCOPE="https://www.googleapis.com/auth/gmail.metadata";
export const GMAIL_CALLBACK="https://www.orbisy.com/api/admin/followups/gmail/callback";
function encryptionKey(){const value=process.env.FOLLOWUP_TOKEN_ENCRYPTION_KEY||"";const key=Buffer.from(value,"base64");if(key.length!==32||key.toString("base64")!==value)throw Error("FOLLOWUP_ENCRYPTION_NOT_CONFIGURED");return key;}
export function gmailConfigurationReady(){try{encryptionKey();return !!process.env.GMAIL_CLIENT_ID&&!!process.env.GMAIL_CLIENT_SECRET;}catch{return false;}}
export function encryptGmailToken(token:string){const iv=randomBytes(12);const cipher=createCipheriv("aes-256-gcm",encryptionKey(),iv);const payload=Buffer.concat([cipher.update(token,"utf8"),cipher.final()]);return ["v1",iv.toString("base64"),cipher.getAuthTag().toString("base64"),payload.toString("base64")].join(".");}
export function decryptGmailToken(value:string){const [v,iv,tag,payload]=value.split(".");if(v!=="v1"||!iv||!tag||!payload)throw Error("INVALID_GMAIL_TOKEN");const decipher=createDecipheriv("aes-256-gcm",encryptionKey(),Buffer.from(iv,"base64"));decipher.setAuthTag(Buffer.from(tag,"base64"));return Buffer.concat([decipher.update(Buffer.from(payload,"base64")),decipher.final()]).toString("utf8");}
class GmailRequestError extends Error {
 constructor(readonly operation:"token"|"profile"|"history"|"message",readonly status:number){super(`Gmail ${operation} request failed (HTTP ${status}).`);}
}
export function safeSyncFailure(error:unknown){
 if(error instanceof GmailRequestError)return error.message;
 const cause=error instanceof Error?error.cause:undefined;
 const candidate=cause&&typeof cause==="object"&&"code" in cause?cause.code:error&&typeof error==="object"&&"code" in error?error.code:undefined;
 return typeof candidate==="string"&&/^(?:[A-Z0-9]{5}|ERR_[A-Z_]{1,64})$/.test(candidate)?candidate:"UNKNOWN";
}
export async function googleTokenRequest(params:Record<string,string>){const response=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({...params,client_id:process.env.GMAIL_CLIENT_ID||"",client_secret:process.env.GMAIL_CLIENT_SECRET||""}),signal:AbortSignal.timeout(8000),cache:"no-store"});if(!response.ok)throw new GmailRequestError("token",response.status);const data=await response.json() as {access_token:string;refresh_token?:string;scope?:string};if(typeof data.access_token!=="string"||!data.access_token||data.access_token.length>8192)throw Error("INVALID_GMAIL_TOKEN");return data;}
export async function gmailGet(path:string,accessToken:string){const response=await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`,{headers:{Authorization:`Bearer ${accessToken}`},signal:AbortSignal.timeout(8000),cache:"no-store"});if(!response.ok)throw new GmailRequestError(path.startsWith("history?")?"history":path.startsWith("messages/")?"message":"profile",response.status);return response.json();}
export function mailboxAddresses(value:string){return (value.match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)||[]).map(v=>v.toLowerCase());}
export type GmailMetadata={id:string;internalDate?:string;labelIds?:string[];payload?:{headers?:Array<{name:string;value:string}>}};
// History can reference a message that was permanently removed afterward.
export async function getGmailMessageMetadata(id: string, accessToken: string, headers: string[]) {
 const query = new URLSearchParams({format:"metadata"});
 for (const header of headers) query.append("metadataHeaders", header);
 try {
  return await gmailGet(`messages/${encodeURIComponent(id)}?${query}`, accessToken) as GmailMetadata & {threadId?: string};
 } catch (error) {
  if (!(error instanceof GmailRequestError) || error.operation !== "message" || error.status !== 404) throw error;
  console.info("Gmail history message no longer available", {stage:"message metadata", status:404});
  return null;
 }
}
export async function applyGmailMetadata(message:GmailMetadata){const headers=message.payload?.headers||[];const read=(name:string)=>headers.filter(h=>h.name.toLowerCase()===name).map(h=>h.value).join(",");const from=mailboxAddresses(read("from"));const recipients=mailboxAddresses([read("to"),read("cc"),read("bcc")].join(","));const sent=message.labelIds?.includes("SENT")&&from.includes(FOLLOWUP_MAILBOX);const participants=sent?recipients:from;if(!participants.length)return;
 const at=new Date(Number(message.internalDate));if(!Number.isFinite(at.getTime()))throw Error("Gmail message date missing; synchronization must be reviewed.");
 await getDb().transaction(async tx=>{const conversations=await tx.select({conversation:followupConversations,receivedAt:contactSubmissions.submittedAt}).from(followupConversations).innerJoin(contactSubmissions,eq(followupConversations.submissionId,contactSubmissions.id)).where(ne(followupConversations.state,"closed"));for(const {conversation,receivedAt} of conversations){
 if(!participants.includes(conversation.recipientEmail)||at<receivedAt)continue;
 if(sent&&conversation.personalResponseAt&&at<=conversation.personalResponseAt)continue;
 await pauseConversation(tx,conversation.id,sent?"A personal Gmail response was detected. Review next steps before resuming.":"A reply from this contact was detected in Gmail. Automated follow-ups stopped.",at,`gmail:${message.id}:${conversation.id}`,!sent);
 }});
}
export async function syncGmail(){const settings=await getFollowupSettings();if(!gmailConfigurationReady()||!settings.gmailTokenCiphertext||!settings.gmailCursor)return false;
 let stage="token refresh";
 try{
 const token=await googleTokenRequest({grant_type:"refresh_token",refresh_token:decryptGmailToken(settings.gmailTokenCiphertext)});
 stage="mailbox profile";
 const profile=await gmailGet("profile",token.access_token) as {emailAddress:string;historyId:string};if(profile.emailAddress?.toLowerCase()!==FOLLOWUP_MAILBOX)throw Error("Gmail mailbox does not match info@orbisy.com.");
 if(!/^\d{1,120}$/.test(profile.historyId))throw Error("INVALID_GMAIL_CURSOR");
 let pageToken=settings.gmailPageToken||undefined;
 for(let page=0;page<3;page++){
 const params=new URLSearchParams({startHistoryId:settings.gmailCursor,historyTypes:"messageAdded",maxResults:"25"});if(pageToken)params.set("pageToken",pageToken);
 stage="mailbox history";
 const data=await gmailGet(`history?${params}`,token.access_token) as {history?:Array<{messagesAdded?:Array<{message:{id:string}}>}>;nextPageToken?:string;historyId:string};
 if(typeof data.historyId!=="string"||!/^\d{1,120}$/.test(data.historyId))throw Error("INVALID_GMAIL_HISTORY");
 const ids=[...new Set((data.history||[]).flatMap(h=>(h.messagesAdded||[]).map(x=>x.message.id)))];if(ids.length>150)throw Error("Gmail backlog needs manual review; no messages will be sent.");
 stage="message metadata";
 for(let i=0;i<ids.length;i+=5){
  const metadata=await Promise.all(ids.slice(i,i+5).map(id=>getGmailMessageMetadata(id,token.access_token,["From","To","Cc","Bcc"])));
  for(const message of metadata)if(message)await applyGmailMetadata(message);
 }
 pageToken=data.nextPageToken;
 await getDb().update(followupSettings).set({gmailPageToken:pageToken||null,...(!pageToken?{gmailCursor:data.historyId,gmailSyncedAt:new Date(),gmailError:null}: {gmailError:"Gmail backlog is being synchronized. Sending is paused until complete."})}).where(eq(followupSettings.id,"main"));
 if(!pageToken)return true;
 }
 return false;
 }catch(error){
 const reason=safeSyncFailure(error);console.error("Orbisy Gmail sync failed",{stage,reason});
 await getDb().update(followupSettings).set({gmailError:`Gmail sync blocked during ${stage}: ${reason} Sending remains blocked.`}).where(eq(followupSettings.id,"main"));return false;
 }}
export async function saveGmailConnection(refreshToken:string,accessToken:string){const profile=await gmailGet("profile",accessToken) as {emailAddress:string;historyId:string};if(profile.emailAddress?.toLowerCase()!==FOLLOWUP_MAILBOX||!/^\d{1,120}$/.test(profile.historyId))throw Error("WRONG_GMAIL_MAILBOX");await getFollowupSettings();await getDb().transaction(async tx=>{await tx.select({id:followupSettings.id}).from(followupSettings).where(eq(followupSettings.id,"main")).for("update");const conversations=await tx.select().from(followupConversations).where(ne(followupConversations.state,"closed"));for(const c of conversations)await pauseConversation(tx,c.id,"Mailbox connected or reconnected. Review this existing conversation before sending.");await tx.update(followupSettings).set({gmailTokenCiphertext:encryptGmailToken(refreshToken),gmailCursor:profile.historyId,gmailPageToken:null,gmailSyncedAt:new Date(),gmailError:null,enrollmentEnabled:false,sendingEnabled:false,autoAcknowledge:false,activatedAt:null,updatedAt:new Date()}).where(eq(followupSettings.id,"main"));});}
export async function disconnectGmail(){const settings=await getFollowupSettings();await getDb().transaction(async tx=>{await tx.select({id:followupSettings.id}).from(followupSettings).where(eq(followupSettings.id,"main")).for("update");const rows=await tx.select().from(followupConversations).where(ne(followupConversations.state,"closed"));for(const c of rows)await pauseConversation(tx,c.id,"Gmail disconnected. Sending stopped.");await tx.update(followupSettings).set({gmailTokenCiphertext:null,gmailCursor:null,gmailPageToken:null,gmailSyncedAt:null,gmailError:null,enrollmentEnabled:false,sendingEnabled:false,autoAcknowledge:false,activatedAt:null}).where(eq(followupSettings.id,"main"));});if(settings.gmailTokenCiphertext){try{await fetch("https://oauth2.googleapis.com/revoke",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({token:decryptGmailToken(settings.gmailTokenCiphertext)}),signal:AbortSignal.timeout(5000)});}catch{/* Local disconnect remains effective; provider access can also be revoked in Google Account. */}}}
