import "server-only";
import {cookies} from "next/headers";
import {getAdminIdentity} from "@/lib/auth";
import {GMAIL_CALLBACK,gmailConfigurationReady,googleTokenRequest} from "@/lib/followups/gmail";
import {secureEqual} from "@/lib/followups/security";
import {connectOutreachMailbox,OUTREACH_SCOPES} from "./gmail";
const destination=(notice:string)=>new Response(null,{status:303,headers:{Location:`https://www.orbisy.com/admin-portal/outreach?notice=${notice}`,"Cache-Control":"no-store","Referrer-Policy":"no-referrer"}});
export async function finishOutreachOAuth(request:Request){
 if(!await getAdminIdentity())return new Response("Unauthorized",{status:401});
 const jar=await cookies(),saved=jar.get("__Host-orbisy_outreach_state")?.value;jar.set("__Host-orbisy_outreach_state","",{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:0});
 const url=new URL(request.url),state=url.searchParams.get("state")||"";
 if(process.env.VERCEL_ENV!=="production"||!gmailConfigurationReady()||!saved||!/^outreach\.[a-f0-9]{64}$/.test(state)||!secureEqual(saved,state))return destination("outreach_failed");
 if(url.searchParams.has("error"))return destination("outreach_denied");const code=url.searchParams.get("code");if(!code||code.length>4096)return destination("outreach_failed");
 try{const token=await googleTokenRequest({grant_type:"authorization_code",code,redirect_uri:GMAIL_CALLBACK});const scopes=token.scope?.split(/\s+/).filter(Boolean)||[];if(!token.refresh_token||OUTREACH_SCOPES.some(scope=>!scopes.includes(scope))||scopes.some(scope=>!OUTREACH_SCOPES.includes(scope)))throw Error("INCOMPLETE_OUTREACH_PERMISSION");await connectOutreachMailbox(token.refresh_token,token.access_token);return destination("outreach_connected");}catch{return destination("outreach_failed");}
}
