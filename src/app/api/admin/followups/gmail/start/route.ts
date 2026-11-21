import {randomBytes} from "node:crypto";
import {cookies} from "next/headers";
import {getAdminIdentity} from "@/lib/auth";
import {GMAIL_CALLBACK,GMAIL_SCOPE,gmailConfigurationReady} from "@/lib/followups/gmail";
export async function POST(request: Request) {
  if (!await getAdminIdentity()) return new Response("Unauthorized", {status:401});
  if (request.headers.get("origin") !== "https://www.orbisy.com" || process.env.VERCEL_ENV !== "production" || !gmailConfigurationReady()) {
    return new Response("Gmail connection is not configured for this deployment.", {status:409});
  }
  const state = randomBytes(32).toString("hex");
  (await cookies()).set("__Host-orbisy_gmail_oauth_state", state, {
    httpOnly:true, secure:true, sameSite:"lax", path:"/", maxAge:600,
  });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id:process.env.GMAIL_CLIENT_ID!, redirect_uri:GMAIL_CALLBACK,
    response_type:"code", scope:GMAIL_SCOPE, access_type:"offline", prompt:"consent",
    state, login_hint:"info@orbisy.com", include_granted_scopes:"false",
  }).toString();
  const headers = {"Cache-Control":"no-store", "Referrer-Policy":"no-referrer", Vary:"Accept"};
  if (request.headers.get("accept")?.includes("application/json")) {
    return Response.json({authorizationUrl:url.toString()}, {headers});
  }
  return new Response(null, {status:303, headers:{...headers, Location:url.toString()}});
}
