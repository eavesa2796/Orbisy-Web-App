// @vitest-environment node
import {readFile,readdir} from "node:fs/promises";
import {join} from "node:path";
import {PGlite} from "@electric-sql/pglite";
import {drizzle} from "drizzle-orm/pglite";
import {eq} from "drizzle-orm";
import {afterAll,afterEach,beforeAll,beforeEach,describe,expect,it,vi} from "vitest";
import type {getDb} from "@/lib/db";
import * as schema from "@/lib/db/schema";
import {postgresDateSerialization} from "@/test/postgres-date-serialization";
const mocks=vi.hoisted(()=>({db:null as unknown as ReturnType<typeof getDb>,admin:vi.fn(),identity:vi.fn(),cookies:new Map<string,string>()}));
vi.mock("@/lib/db",()=>({getDb:()=>mocks.db}));vi.mock("@/lib/auth",()=>({requireAdmin:mocks.admin,getAdminIdentity:mocks.identity}));vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));vi.mock("next/headers",()=>({cookies:async()=>({get:(name:string)=>mocks.cookies.has(name)?{value:mocks.cookies.get(name)}:undefined,set:(name:string,value:string)=>mocks.cookies.set(name,value)})}));
import {createOutreachCampaign,addOutreachProspect,approveOutreachSequence,getOutreachSettings,pauseOutreach} from "./service";
import {outreachDefaults} from "./model";
import {connectOutreachMailbox,applyOutreachMetadata,messageIdentity,OUTREACH_SCOPES,syncOutreachMailbox} from "./gmail";
import {dispatchOutreach,runOutreachWorker,outreachMime} from "./worker";
import {outreachStopUrl} from "./security";
import {verifyUnsubscribeToken} from "@/lib/followups/security";
import {getOutreachPreferences,postOutreachPreferences} from "./preferences";
import {getOutreachOverview} from "@/lib/data/outreach";
import {createCampaignAction,approveSequenceAction,saveOutreachSettingsAction} from "@/app/admin-portal/outreach/actions";
import {POST as startOAuth} from "@/app/api/admin/outreach/gmail/start/route";
import {GET as finishOAuth} from "@/app/api/admin/followups/gmail/callback/route";
let pg:PGlite;
const initial={success:false,message:""};
const campaignInput={name:outreachDefaults.name,subject:outreachDefaults.subject,body0:outreachDefaults.bodies[0],body1:outreachDefaults.bodies[1],body2:outreachDefaults.bodies[2]};
beforeAll(async()=>{pg=new PGlite();await pg.exec("create role anon; create role authenticated; alter default privileges in schema public grant all on tables to anon,authenticated;");for(const name of (await readdir(join(process.cwd(),"drizzle"))).filter(n=>/^\d{4}.*\.sql$/.test(n)).sort())await pg.exec((await readFile(join(process.cwd(),"drizzle",name),"utf8")).replaceAll("--> statement-breakpoint",""));mocks.db=drizzle(pg,{schema,logger:postgresDateSerialization}) as unknown as ReturnType<typeof getDb>;},30000);
beforeEach(async()=>{vi.useFakeTimers({toFake:["Date"]});vi.setSystemTime(new Date("2026-11-23T16:00:00Z"));await pg.exec("delete from outreach_events; delete from outreach_messages; delete from outreach_enrollments; delete from outreach_campaigns; delete from outreach_settings; delete from followup_events; delete from followup_messages; delete from followup_conversations; delete from followup_settings; delete from suppression_entries; delete from leads; delete from contact_submissions;");mocks.admin.mockResolvedValue({email:"owner@example.test"});mocks.identity.mockResolvedValue({email:"owner@example.test"});mocks.cookies.clear();vi.stubEnv("VERCEL_ENV","production");vi.stubEnv("OUTREACH_SEND_ENABLED","true");vi.stubEnv("GMAIL_CLIENT_ID","fictional-client");vi.stubEnv("GMAIL_CLIENT_SECRET","fictional-secret");vi.stubEnv("FOLLOWUP_TOKEN_ENCRYPTION_KEY",Buffer.alloc(32,3).toString("base64"));vi.stubEnv("FOLLOWUP_UNSUBSCRIBE_SECRET","fictional-outreach-signing-key-longer-than-32-characters");vi.stubEnv("FOLLOWUP_POSTAL_ADDRESS","123 Example St\nExample City, IL 60000");});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();vi.unstubAllEnvs();vi.restoreAllMocks();});afterAll(async()=>pg.close());
async function draft(){const c=await createOutreachCampaign(campaignInput,"owner");const e=await addOutreachProspect({campaignId:c.id,businessName:"Example Association",recipientName:"Sam Example",recipientEmail:`sam-${crypto.randomUUID()}@example.test`,sourceUrl:"https://example.test/contact",contactBasis:"business_introduction",contactReason:"Reviewed the published operations role and a specific relevant website workflow."},"owner");return {c,e};}
async function ready(){const row=await draft();await approveOutreachSequence(row.e.id,campaignInput,"owner");await mocks.db.update(schema.outreachCampaigns).set({status:"active"}).where(eq(schema.outreachCampaigns.id,row.c.id));await mocks.db.update(schema.outreachSettings).set({sendingEnabled:true,policyReviewedAt:new Date(),gmailTokenCiphertext:"encrypted-placeholder",gmailCursor:"100",gmailSyncedAt:new Date()});return row;}
function sendProvider(){const send=vi.fn().mockResolvedValue(new Response(JSON.stringify({id:"gmail-1",threadId:"thread-1"}),{status:200}));vi.stubGlobal("fetch",send);return send;}
async function refresh(){await mocks.db.update(schema.outreachSettings).set({gmailSyncedAt:new Date(),gmailError:null});}

describe("Reviewed outbound outreach",()=>{
 it("detects a reply after an individually missing history message",async()=>{
  const {e}=await ready();
  sendProvider();
  expect(await dispatchOutreach("access")).toBe(true);
  vi.spyOn(console,"info").mockImplementation(()=>{});
  vi.stubGlobal("fetch",vi.fn(async(input:RequestInfo|URL)=>{
   const url=String(input);
   if(url.includes("/history?"))return Response.json({historyId:"102",history:[{messagesAdded:[{message:{id:"deleted"}},{message:{id:"reply"}}]}]});
   if(url.includes("/messages/deleted?"))return new Response("unavailable",{status:404});
   return Response.json({id:"reply",threadId:"thread-1",internalDate:String(Date.now()+1000),payload:{headers:[{name:"From",value:e.recipientEmail}]}});
  }));
  expect(await syncOutreachMailbox("access")).toBe(true);
  expect((await getOutreachSettings()).gmailCursor).toBe("102");
  expect((await mocks.db.select().from(schema.outreachEnrollments))[0].state).toBe("replied");
 });
 it("starts paused, preserves existing inquiry settings on Google connection, and keeps secrets out of the overview",async()=>{
  await mocks.db.insert(schema.followupSettings).values({id:"main",sendingEnabled:true,enrollmentEnabled:true,autoAcknowledge:true,activatedAt:new Date(),gmailTokenCiphertext:"inbound-secret-marker"});
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({emailAddress:"info@orbisy.com",historyId:"100"}))));
  await connectOutreachMailbox("outreach-refresh-secret","access");const settings=await getOutreachSettings();expect(settings.sendingEnabled).toBe(false);expect(settings.gmailTokenCiphertext).not.toContain("outreach-refresh-secret");
  expect((await mocks.db.select().from(schema.followupSettings))[0]).toMatchObject({sendingEnabled:true,enrollmentEnabled:true,autoAcknowledge:true,gmailTokenCiphertext:"inbound-secret-marker"});
  const view=await getOutreachOverview();expect(JSON.stringify(view)).not.toContain(settings.gmailTokenCiphertext);expect(view.settings).not.toHaveProperty("gmailCursor");
 });
 it("requires server administrator access before campaign mutations or data reads",async()=>{
  mocks.admin.mockRejectedValueOnce(Error("Unauthorized"));await expect(createCampaignAction(initial,new FormData())).rejects.toThrow("Unauthorized");expect(await mocks.db.select().from(schema.outreachCampaigns)).toHaveLength(0);
  mocks.admin.mockRejectedValueOnce(Error("Unauthorized"));await expect(getOutreachOverview()).rejects.toThrow("Unauthorized");
 });
 it("secures all five new tables without granting public Data API access",async()=>{
  const result=await pg.query<{relrowsecurity:boolean;anon:boolean;authenticated:boolean}>("select relrowsecurity,has_table_privilege('anon',oid,'SELECT') as anon,has_table_privilege('authenticated',oid,'SELECT') as authenticated from pg_class where relname in ('outreach_settings','outreach_campaigns','outreach_enrollments','outreach_messages','outreach_events')");expect(result.rows).toHaveLength(5);expect(result.rows.every(r=>r.relrowsecurity&&!r.anon&&!r.authenticated)).toBe(true);
 });
 it("deduplicates prospects without orphan leads and never enrolls existing leads automatically",async()=>{
  const {c,e}=await draft();await expect(addOutreachProspect({campaignId:c.id,businessName:e.businessName,recipientName:e.recipientName,recipientEmail:e.recipientEmail,sourceUrl:e.sourceUrl,contactBasis:e.contactBasis,contactReason:e.contactReason},"owner")).rejects.toThrow();expect(await mocks.db.select().from(schema.leads)).toHaveLength(1);expect(await mocks.db.select().from(schema.outreachEnrollments)).toHaveLength(1);
  const provider=sendProvider();expect(await dispatchOutreach("access")).toBe(false);expect(provider).not.toHaveBeenCalled();
 });
 it("requires explicit sequence review and refuses header injection",async()=>{
  const {e}=await draft();const form=new FormData();form.set("id",e.id);Object.entries(campaignInput).forEach(([k,v])=>form.set(k,v));expect((await approveSequenceAction(initial,form)).success).toBe(false);
  await expect(createOutreachCampaign({...campaignInput,subject:"Hello\r\nBcc: someone@example.test"},"owner")).rejects.toThrow();
 });
 it("blocks global sending, preview sending, paused campaigns, stale Gmail, and outside-window delivery",async()=>{
  const {c}=await ready();const provider=sendProvider();vi.stubEnv("OUTREACH_SEND_ENABLED","false");expect(await dispatchOutreach("access")).toBe(false);vi.stubEnv("OUTREACH_SEND_ENABLED","true");vi.stubEnv("VERCEL_ENV","preview");expect(await dispatchOutreach("access")).toBe(false);vi.stubEnv("VERCEL_ENV","production");
  await mocks.db.update(schema.outreachCampaigns).set({status:"paused"}).where(eq(schema.outreachCampaigns.id,c.id));expect(await dispatchOutreach("access")).toBe(false);await mocks.db.update(schema.outreachCampaigns).set({status:"active"});
  await mocks.db.update(schema.outreachSettings).set({gmailSyncedAt:new Date("2026-11-23T15:00:00Z")});expect(await dispatchOutreach("access")).toBe(false);await refresh();vi.setSystemTime(new Date("2026-11-23T23:00:00Z"));await refresh();expect(await dispatchOutreach("access")).toBe(false);expect(provider).not.toHaveBeenCalled();
 });
 it("honors shared domain, email, lead and source suppressions before approval or delivery",async()=>{
  const {e}=await ready();await mocks.db.insert(schema.suppressionEntries).values({normalizedDomain:"example.test",type:"domain",reason:"No contact"});const provider=sendProvider();expect(await dispatchOutreach("access")).toBe(false);expect(provider).not.toHaveBeenCalled();expect((await mocks.db.select().from(schema.outreachEnrollments))[0].state).toBe("paused");expect((await mocks.db.select().from(schema.outreachMessages)).every(m=>m.status==="cancelled")).toBe(true);
  await mocks.db.delete(schema.suppressionEntries);await mocks.db.insert(schema.suppressionEntries).values({leadId:e.leadId,type:"lead",reason:"No contact"});await expect(approveOutreachSequence(e.id,campaignInput,"owner")).rejects.toThrow("do-not-contact");
 });
 it("sends one personalized branded introduction, records acceptance, and schedules follow-ups from the accepted email",async()=>{
  const {e}=await ready();const provider=sendProvider();expect(await dispatchOutreach("access")).toBe(true);
  const rows=await mocks.db.select().from(schema.outreachMessages).where(eq(schema.outreachMessages.enrollmentId,e.id));const first=rows.find(m=>m.step===0)!;expect(first).toMatchObject({status:"sent",providerId:"gmail-1",threadId:"thread-1"});expect(rows.find(m=>m.step===1)?.dueAt?.toISOString()).toBe("2026-11-26T16:00:00.000Z");expect(rows.find(m=>m.step===2)?.dueAt).toBeNull();
  const init=provider.mock.calls[0][1] as RequestInit;const payload=JSON.parse(init.body as string);const mime=Buffer.from(payload.raw,"base64url").toString("utf8");expect(mime).toContain("From: Orbisy <info@orbisy.com>");expect(mime).toContain("List-Unsubscribe-Post: List-Unsubscribe=One-Click");expect(mime).toContain("multipart/alternative");expect(mime).toContain(messageIdentity(first.id));
  const html=Buffer.from(mime.split("Content-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n")[1].split("\r\n--orbisy-")[0].replaceAll("\r\n",""),"base64").toString();expect(html).toContain("Hi Sam");expect(html).toContain(">Stop These Follow Ups</a>");expect(html).toContain("/outreach-preferences?token=");expect(html).toContain("123 Example St<br>Example City, IL 60000");expect(html).toContain("Business solicitation from Orbisy LLC.");
  expect((await mocks.db.select().from(schema.leads))[0].status).toBe("contacted");expect((await getOutreachOverview()).messages[0]).not.toHaveProperty("mimeRaw");
 });
 it("enforces spacing and the daily cap across all steps",async()=>{
  await ready();await ready();await mocks.db.update(schema.outreachSettings).set({dailyLimit:1});const provider=sendProvider();expect(await dispatchOutreach("access")).toBe(true);vi.setSystemTime(new Date("2026-11-23T16:11:00Z"));await refresh();expect(await dispatchOutreach("access")).toBe(false);expect(provider).toHaveBeenCalledTimes(1);
 });
 it("does not double-claim a send under concurrent workers",async()=>{
  await ready();const provider=sendProvider();expect((await Promise.all([dispatchOutreach("access"),dispatchOutreach("access")])).filter(Boolean)).toHaveLength(1);expect(provider).toHaveBeenCalledTimes(1);
 });
 it("never blindly retries an uncertain Gmail response",async()=>{
  const {e}=await ready();const provider=vi.fn().mockRejectedValue(Error("Connection interrupted"));vi.stubGlobal("fetch",provider);expect(await dispatchOutreach("access")).toBe(false);expect((await mocks.db.select().from(schema.outreachMessages).where(eq(schema.outreachMessages.step,0)))[0].status).toBe("uncertain");expect((await mocks.db.select().from(schema.outreachEnrollments))[0].state).toBe("paused");vi.setSystemTime(new Date("2026-11-23T16:20:00Z"));await refresh();expect(await dispatchOutreach("access")).toBe(false);expect(await approveOutreachSequence(e.id,campaignInput,"owner")).toBe(false);expect(provider).toHaveBeenCalledTimes(1);
 });
 it("ignores its own Sent email but stops on a personal reply without saving bodies",async()=>{
  const {e}=await ready();sendProvider();await dispatchOutreach("access");const first=(await mocks.db.select().from(schema.outreachMessages).where(eq(schema.outreachMessages.step,0)))[0];
  await applyOutreachMetadata({id:"gmail-1",threadId:"thread-1",internalDate:String(Date.now()+1000),labelIds:["SENT"],payload:{headers:[{name:"From",value:"info@orbisy.com"},{name:"To",value:e.recipientEmail},{name:"Message-ID",value:messageIdentity(first.id)}]}});expect((await mocks.db.select().from(schema.outreachEnrollments))[0].state).toBe("approved");
  const metadata={id:"reply-1",threadId:"thread-1",internalDate:String(Date.now()+2000),payload:{headers:[{name:"From",value:e.recipientEmail},{name:"In-Reply-To",value:messageIdentity(first.id)}],body:{data:"PRIVATE_BODY_MUST_NOT_BE_COPIED"}}};await applyOutreachMetadata(metadata);await applyOutreachMetadata(metadata);expect((await mocks.db.select().from(schema.outreachEnrollments))[0].state).toBe("replied");expect((await mocks.db.select().from(schema.leads))[0].status).toBe("replied");const events=await mocks.db.select().from(schema.outreachEvents);expect(events.filter(x=>x.kind==="reply_detected")).toHaveLength(1);expect(JSON.stringify(events)).not.toContain("PRIVATE_BODY_MUST_NOT_BE_COPIED");
 });
 it("stops if the lead outcome changes or the recipient address is edited",async()=>{
  const {e}=await ready();await mocks.db.update(schema.leads).set({status:"won"}).where(eq(schema.leads.id,e.leadId));const provider=sendProvider();expect(await dispatchOutreach("access")).toBe(false);expect(provider).not.toHaveBeenCalled();
 });
 it("makes stop links read-only until confirmation, namespaces their signatures, and cancels all pending emails",async()=>{
  const {e}=await ready(),url=outreachStopUrl(e.id),token=new URL(url).searchParams.get("token")!;expect(verifyUnsubscribeToken(token)).toBeUndefined();const get=await getOutreachPreferences(new Request(url));expect(get.status).toBe(200);expect(await get.text()).toContain('action="/outreach-preferences"');expect((await mocks.db.select().from(schema.outreachEnrollments))[0].state).toBe("approved");
  for(let i=0;i<2;i++)expect((await postOutreachPreferences(new Request(url,{method:"POST"}),true)).status).toBe(200);expect((await mocks.db.select().from(schema.outreachMessages)).every(m=>m.status==="cancelled")).toBe(true);expect((await mocks.db.select().from(schema.outreachEnrollments))[0].state).toBe("stopped");expect(await mocks.db.select().from(schema.suppressionEntries)).toHaveLength(1);
 });
 it("requires the mailbox, deployment gates, mailing setup, and policy review before enabling",async()=>{
  const form=new FormData();form.set("dailyLimit","5");form.set("sendingEnabled","on");expect((await saveOutreachSettingsAction(initial,form)).success).toBe(false);expect((await getOutreachSettings()).sendingEnabled).toBe(false);
 });
 it("has a separate OAuth state, requests only sending plus metadata, and validates wrong mailbox without touching inbound",async()=>{
  const response=await startOAuth(new Request("https://www.orbisy.com/api/admin/outreach/gmail/start",{method:"POST",headers:{origin:"https://www.orbisy.com",accept:"application/json"}}));const url=new URL((await response.json()).authorizationUrl);expect(url.searchParams.get("scope")?.split(" ")).toEqual(OUTREACH_SCOPES);expect(url.searchParams.get("redirect_uri")).toBe("https://www.orbisy.com/api/admin/followups/gmail/callback");const state=url.searchParams.get("state")!;expect(state).toMatch(/^outreach\./);
  vi.stubGlobal("fetch",vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({access_token:"access",refresh_token:"refresh",scope:OUTREACH_SCOPES.join(" ")}))).mockResolvedValueOnce(new Response(JSON.stringify({emailAddress:"wrong@example.test",historyId:"100"}))));const callback=await finishOAuth(new Request(`https://www.orbisy.com/api/admin/followups/gmail/callback?state=${state}&code=example-code`));expect(callback.headers.get("Location")).toContain("outreach_failed");expect((await getOutreachSettings()).gmailTokenCiphertext).toBeNull();
 });
 it("keeps worker runs behind the production gate",async()=>{vi.stubEnv("OUTREACH_SEND_ENABLED","false");const fetch=vi.fn();vi.stubGlobal("fetch",fetch);expect(await runOutreachWorker()).toEqual({status:"disabled",sent:0});expect(fetch).not.toHaveBeenCalled();});
 it("distinguishes automatic notifications from human replies and pauses unmatched delivery notices",async()=>{
  const {e}=await ready();sendProvider();await dispatchOutreach("access");
  await applyOutreachMetadata({id:"auto-reply",threadId:"thread-1",internalDate:String(Date.now()+1000),payload:{headers:[{name:"From",value:e.recipientEmail},{name:"Auto-Submitted",value:"auto-replied"}]}});
  expect((await mocks.db.select().from(schema.outreachEnrollments))[0].state).toBe("paused");expect((await mocks.db.select().from(schema.leads))[0].status).toBe("contacted");
  await applyOutreachMetadata({id:"unmatched-bounce",internalDate:String(Date.now()+2000),payload:{headers:[{name:"From",value:"mailer-daemon@example.test"},{name:"X-Failed-Recipients",value:"unrelated@example.test"}]}});
  expect((await getOutreachSettings()).sendingEnabled).toBe(false);expect((await mocks.db.select().from(schema.outreachEvents)).some(e=>e.kind==="delivery_review")).toBe(true);
 });
 it("confirms an uncertain initial send from matching Sent metadata without restarting the cancelled sequence",async()=>{
  const {e}=await ready();vi.stubGlobal("fetch",vi.fn().mockRejectedValue(Error("Unknown send outcome")));await dispatchOutreach("access");const first=(await mocks.db.select().from(schema.outreachMessages).where(eq(schema.outreachMessages.step,0)))[0];
  await applyOutreachMetadata({id:"found-in-sent",threadId:"found-thread",internalDate:String(Date.now()+1000),labelIds:["SENT"],payload:{headers:[{name:"From",value:"info@orbisy.com"},{name:"To",value:e.recipientEmail},{name:"Message-ID",value:messageIdentity(first.id)}]}});
  expect((await mocks.db.select().from(schema.outreachMessages).where(eq(schema.outreachMessages.id,first.id)))[0].status).toBe("sent");expect((await mocks.db.select().from(schema.outreachEnrollments))[0].state).toBe("paused");expect((await mocks.db.select().from(schema.outreachMessages)).filter(m=>m.step>0).every(m=>m.status==="cancelled")).toBe(true);
 });
 it("completes the separate Google grant without changing inbound enrollment or sending",async()=>{
  await mocks.db.insert(schema.followupSettings).values({id:"main",sendingEnabled:true,enrollmentEnabled:true,autoAcknowledge:true,gmailTokenCiphertext:"preserved-inbound"});
  const start=await startOAuth(new Request("https://www.orbisy.com/api/admin/outreach/gmail/start",{method:"POST",headers:{origin:"https://www.orbisy.com",accept:"application/json"}}));const state=new URL((await start.json()).authorizationUrl).searchParams.get("state")!;
  vi.stubGlobal("fetch",vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({access_token:"access",refresh_token:"refresh",scope:OUTREACH_SCOPES.join(" ")}))).mockResolvedValueOnce(new Response(JSON.stringify({emailAddress:"info@orbisy.com",historyId:"100"}))));
  const response=await finishOAuth(new Request(`https://www.orbisy.com/api/admin/followups/gmail/callback?state=${state}&code=example`));expect(response.headers.get("Location")).toContain("outreach_connected");expect((await getOutreachSettings()).sendingEnabled).toBe(false);expect((await mocks.db.select().from(schema.followupSettings))[0]).toMatchObject({sendingEnabled:true,enrollmentEnabled:true,autoAcknowledge:true,gmailTokenCiphertext:"preserved-inbound"});
 });
 it("rejects unauthorized, cross-origin and preview OAuth starts",async()=>{
  mocks.identity.mockResolvedValueOnce(null);expect((await startOAuth(new Request("https://www.orbisy.com/api/admin/outreach/gmail/start",{method:"POST"}))).status).toBe(401);
  expect((await startOAuth(new Request("https://www.orbisy.com/api/admin/outreach/gmail/start",{method:"POST",headers:{origin:"https://other.example.test"}}))).status).toBe(409);
  vi.stubEnv("VERCEL_ENV","preview");expect((await startOAuth(new Request("https://www.orbisy.com/api/admin/outreach/gmail/start",{method:"POST",headers:{origin:"https://www.orbisy.com"}}))).status).toBe(409);
 });
 it("folds international subjects safely without corrupting characters",async()=>{
  const {e}=await draft();const first=(await mocks.db.select().from(schema.outreachMessages).where(eq(schema.outreachMessages.enrollmentId,e.id)))[0];const subject="A question about éducation and associations — ".repeat(3);const mime=Buffer.from(outreachMime({...first,subject},e.recipientEmail,outreachStopUrl(e.id)),"base64url").toString();const encoded=mime.match(/^Subject: (.*(?:\r\n .*)*)/m)![1];const words=encoded.match(/=\?UTF-8\?B\?[^?]+\?=/g)!;expect(words.every(word=>word.length<=75)).toBe(true);expect(words.map(word=>Buffer.from(word.slice(10,-2),"base64").toString()).join("")).toBe(subject);
 });
 it("pauses queued emails on manual intervention",async()=>{const {e}=await ready();await pauseOutreach(e.id,"owner");expect((await mocks.db.select().from(schema.outreachMessages)).every(m=>m.status==="cancelled")).toBe(true);});
});
