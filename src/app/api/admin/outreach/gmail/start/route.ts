import {randomBytes} from "node:crypto";
import {cookies} from "next/headers";
import {getAdminIdentity} from "@/lib/auth";
import {GMAIL_CALLBACK,gmailConfigurationReady} from "@/lib/followups/gmail";
import {OUTREACH_SCOPES,OUTREACH_MAILBOX} from "@/lib/outreach/gmail";
export async function POST(request:Request){
 if(!await getAdminIdentity())return new Response("Unauthorized",{status:401});
 if(process.env.VERCEL_ENV!=="production"||request.headers.get("origin")!=="https://www.orbisy.com"||!gmailConfigurationReady())return new Response("Outreach Gmail connection is not configured.",{status:409});
 const state=`outreach.${randomBytes(32).toString("hex")}`;
 (await cookies()).set("__Host-orbisy_outreach_state",state,{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:600});
 const url=new URL("https://accounts.google.com/o/oauth2/v2/auth");url.search=new URLSearchParams({client_id:process.env.GMAIL_CLIENT_ID!,redirect_uri:GMAIL_CALLBACK,response_type:"code",scope:OUTREACH_SCOPES.join(" "),access_type:"offline",prompt:"consent",state,login_hint:OUTREACH_MAILBOX,include_granted_scopes:"false"}).toString();
 const headers={"Cache-Control":"no-store","Referrer-Policy":"no-referrer",Vary:"Accept"};return request.headers.get("accept")?.includes("application/json")?Response.json({authorizationUrl:url.toString()},{headers}):new Response(null,{status:303,headers:{...headers,Location:url.toString()}});
}
