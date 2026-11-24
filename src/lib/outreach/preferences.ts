import "server-only";
import {eq} from "drizzle-orm";
import {getDb} from "@/lib/db";
import {outreachEnrollments,suppressionEntries,followupConversations} from "@/lib/db/schema";
import {preferencePage} from "@/lib/followups/preferences";
import {boundedRequestText} from "@/lib/followups/security";
import {pauseConversation} from "@/lib/followups/service";
import {verifyOutreachStop} from "./security";
import {getOutreachSettings,lockOutreach,stopOutreach} from "./service";
const headers={"Cache-Control":"no-store","Referrer-Policy":"no-referrer","X-Robots-Tag":"noindex, nofollow"};
const page=(state:"confirm"|"stopped"|"invalid"|"error",token="",status=200)=>preferencePage(state,token,status,"/outreach-preferences");
export async function getOutreachPreferences(request:Request){const token=new URL(request.url).searchParams.get("token")||"";return verifyOutreachStop(token)?page("confirm",token):page("invalid","",400);}
export async function postOutreachPreferences(request:Request,human=false){
 if(process.env.VERCEL_ENV!=="production")return new Response(null,{status:404,headers});let token=new URL(request.url).searchParams.get("token")||"";
 if(!token){try{token=new URLSearchParams(await boundedRequestText(request,2000)).get("token")||"";}catch{return human?page("invalid","",413):new Response(null,{status:413,headers});}}
 const id=verifyOutreachStop(token);if(!id)return human?page("invalid","",400):new Response("Invalid preference link",{status:400,headers});
 try{await getOutreachSettings();await getDb().transaction(async tx=>{await lockOutreach(tx);const [enrollment]=await tx.select().from(outreachEnrollments).where(eq(outreachEnrollments.id,id)).for("update");if(!enrollment)return;
 await stopOutreach(tx,id,"Contact stopped automated follow-ups.","stopped");
 const [existing]=await tx.select({id:suppressionEntries.id}).from(suppressionEntries).where(eq(suppressionEntries.normalizedEmail,enrollment.recipientEmail)).limit(1);if(!existing)await tx.insert(suppressionEntries).values({type:"email",normalizedEmail:enrollment.recipientEmail,source:"Outreach preference",reason:"Contact requested no more automated follow-ups."});
 for(const conversation of await tx.select({id:followupConversations.id}).from(followupConversations).where(eq(followupConversations.recipientEmail,enrollment.recipientEmail)))await pauseConversation(tx,conversation.id,"Contact requested no further automated follow-ups.");
 });}catch{return human?page("error",token,503):new Response("Preference could not be saved",{status:503,headers});}
 return human?page("stopped"):new Response("Automated follow-ups stopped.",{headers});
}
