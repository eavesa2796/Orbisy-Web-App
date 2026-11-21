import "server-only";
import {eq} from "drizzle-orm";
import {getDb} from "@/lib/db";
import {followupConversations, suppressionEntries} from "@/lib/db/schema";
import {escapeHtml} from "@/lib/email-brand";
import {verifyUnsubscribeToken, boundedRequestText} from "./security";
import {pauseConversation} from "./service";

const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
};

// A standalone response deliberately bypasses the marketing layout and analytics.
export function preferencePage(state: "confirm" | "stopped" | "invalid" | "error", token = "", status = 200) {
  const title = {confirm:"Stop these follow ups?", stopped:"Automated follow-ups stopped.", invalid:"This link is no longer available.", error:"We couldn’t save your preference."}[state];
  const description = {
    confirm:"Use the button below to stop Orbisy’s automated follow-up emails. Opening this page alone does not change your preferences.",
    stopped:"Your preference has been saved. Orbisy’s automated follow-ups to this email address have been stopped. You can still contact Orbisy directly whenever you need help.",
    invalid:"This link is invalid or has expired. Email info@orbisy.com and ask to stop automated follow-ups.",
    error:"Please try again. If the problem continues, email info@orbisy.com and ask to stop automated follow-ups.",
  }[state];
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>${escapeHtml(title)} | Orbisy</title>
<style>*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:40px 20px;background:radial-gradient(ellipse at top left,#103844 0,transparent 55%),#07111e;color:#eef6ff;font:16px/1.7 system-ui,-apple-system,sans-serif}main{width:100%;max-width:620px;border:1px solid #2a465b;border-radius:28px;background:#0b1929;padding:clamp(28px,6vw,56px);box-shadow:0 24px 80px #0005}.logo{display:inline-block;margin-bottom:32px}.logo img{display:block;width:164px;height:auto}.eyebrow{color:#91f5df;text-transform:uppercase;letter-spacing:.16em;font-size:12px;font-weight:700}h1{font-size:clamp(30px,6vw,42px);line-height:1.15;letter-spacing:-.04em;margin:16px 0 24px}p{color:#c3d2e1;margin:0 0 24px}.button{display:inline-block;border:0;border-radius:12px;padding:15px 22px;background:#91f5df;color:#071923;font:700 16px/1.4 system-ui;cursor:pointer;text-decoration:none;min-height:48px}.button:hover{background:#b8ffed}a{color:#91f5df;text-underline-offset:4px}a:focus-visible,button:focus-visible{outline:3px solid #fff;outline-offset:6px}.help{font-size:14px;margin-top:28px;margin-bottom:0}footer{margin-top:36px;border-top:1px solid #2a465b;padding-top:20px;font-size:13px;color:#9cb2c6}form{margin:0} @media(prefers-reduced-motion:no-preference){.button{transition:background .15s}}</style></head><body><main>
<a class="logo" href="/" aria-label="Orbisy homepage"><img src="/orbisy-horizontal-color.png" width="164" height="76" alt="Orbisy"></a>
<div class="eyebrow">Email preferences</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p>
${state === "confirm" || state === "error" ? `<form method="post" action="/email-preferences"><input type="hidden" name="token" value="${escapeHtml(token)}"><button class="button" type="submit">Stop These Follow Ups</button></form>` : '<a class="button" href="/">Back to Orbisy</a>'}
<p class="help">Need a hand? <a href="mailto:info@orbisy.com">Email info@orbisy.com</a></p><footer>Orbisy LLC · Websites and software for associations</footer></main></body></html>`, {
    status,
    headers: {...headers, "Content-Type":"text/html; charset=utf-8", "Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"},
  });
}

export async function getPreferences(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  return verifyUnsubscribeToken(token) ? preferencePage("confirm", token) : preferencePage("invalid", "", 400);
}

export async function postPreferences(request: Request, human = false) {
  if (process.env.VERCEL_ENV !== "production") return new Response(null, {status:404, headers});
  let token = new URL(request.url).searchParams.get("token") || "";
  if (!token) {
    try { token = new URLSearchParams(await boundedRequestText(request, 2000)).get("token") || ""; }
    catch { return human ? preferencePage("invalid", "", 413) : new Response(null, {status:413, headers}); }
  }
  const id = verifyUnsubscribeToken(token);
  if (!id) return human ? preferencePage("invalid", "", 400) : new Response("Invalid or expired link", {status:400, headers});
  try {
    await getDb().transaction(async tx => {
      const [conversation] = await tx.select().from(followupConversations).where(eq(followupConversations.id, id)).for("update");
      if (!conversation) return;
      await pauseConversation(tx, id, "Contact requested no further automated follow-ups.");
      const [existing] = await tx.select({id:suppressionEntries.id}).from(suppressionEntries).where(eq(suppressionEntries.normalizedEmail, conversation.recipientEmail)).limit(1);
      if (!existing) await tx.insert(suppressionEntries).values({normalizedEmail:conversation.recipientEmail, type:"email", source:"Follow-up preference", reason:"Contact requested no further automated follow-ups."});
    });
  } catch {
    return human ? preferencePage("error", token, 503) : new Response("Preference could not be saved. Please retry.", {status:503, headers});
  }
  return human ? preferencePage("stopped") : new Response("Automated follow-ups stopped. You can still contact info@orbisy.com.", {headers});
}
