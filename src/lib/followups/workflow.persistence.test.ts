// @vitest-environment node
import {readFile,readdir} from "node:fs/promises";
import {join} from "node:path";
import {PGlite} from "@electric-sql/pglite";
import {drizzle} from "drizzle-orm/pglite";
import {and,eq,inArray} from "drizzle-orm";
import {afterAll,afterEach,beforeAll,beforeEach,describe,expect,it,vi} from "vitest";
import type {getDb} from "@/lib/db";
import * as schema from "@/lib/db/schema";
import {postgresDateSerialization} from "@/test/postgres-date-serialization";
const mocks=vi.hoisted(()=>({db:null as unknown as ReturnType<typeof getDb>,getDb:vi.fn(),admin:vi.fn(),identity:vi.fn(),cookies:new Map<string,string>()}));
vi.mock("@/lib/db",()=>({getDb:()=>{mocks.getDb();return mocks.db;}}));vi.mock("@/lib/auth",()=>({requireAdmin:mocks.admin,getAdminIdentity:mocks.identity}));vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));vi.mock("next/headers",()=>({cookies:async()=>({get:(name:string)=>mocks.cookies.has(name)?{value:mocks.cookies.get(name)}:undefined,set:(name:string,value:string)=>mocks.cookies.set(name,value)})}));
import {enrollInquiry,enrollNewInquiries,getFollowupSettings,recordPersonalResponse} from "./service";
import {applyGmailMetadata,encryptGmailToken,syncGmail} from "./gmail";
import {deliverFollowupMessage,reconcileDeliveryEvents} from "./delivery";
import {runFollowupWorker,queueDailyDigest} from "./worker";
import {getFollowupOverview} from "@/lib/data/followups";
import {approveFollowupAction,enrollFollowupAction,followupConversationAction,saveFollowupSettingsAction,runFollowupsAction} from "@/app/admin-portal/followups/actions";
import {POST as gmailStart} from "@/app/api/admin/followups/gmail/start/route";
import {GET as gmailCallback} from "@/app/api/admin/followups/gmail/callback/route";
import {POST as workerRoute} from "@/app/api/internal/followups/route";
import {POST as deliveryRoute} from "@/app/api/followups/delivery/route";
import {GET as unsubscribeGet,POST as unsubscribePost} from "@/app/api/followups/unsubscribe/route";
import {unsubscribeUrl} from "./security";
import {GET as preferenceGet,POST as preferencePost} from "@/app/email-preferences/route";
let pg:PGlite;const initial={success:false,message:""};
beforeAll(async()=>{pg=new PGlite();const names=(await readdir(join(process.cwd(),"drizzle"))).filter(n=>/^\d{4}.*\.sql$/.test(n)).sort();for(const name of names.filter(n=>!n.startsWith("0012_")))await pg.exec((await readFile(join(process.cwd(),"drizzle",name),"utf8")).replaceAll("--> statement-breakpoint",""));await pg.exec("insert into leads(business_name,source_name,status) values('Preserved imported record','Legacy fixture','proposal_sent'); insert into pricing_entries(name,category,amount_cents,status,updated_by) values('Preserved price','website',450000,'active','owner@example.test')");await pg.exec((await readFile(join(process.cwd(),"drizzle/0012_inbound_followups.sql"),"utf8")).replaceAll("--> statement-breakpoint",""));mocks.db=drizzle(pg,{schema,logger:postgresDateSerialization}) as unknown as ReturnType<typeof getDb>;},30000);
beforeEach(async()=>{vi.useFakeTimers({toFake:["Date"]});vi.setSystemTime(new Date("2026-11-18T18:00:00Z"));await pg.exec("delete from followup_events;delete from followup_messages;delete from followup_conversations;delete from followup_settings;delete from suppression_entries;delete from leads where source_name='Inbound consultation';delete from contact_submissions;");mocks.admin.mockResolvedValue({email:"owner@example.test"});mocks.identity.mockResolvedValue(null);mocks.getDb.mockClear();mocks.cookies.clear();vi.stubEnv("VERCEL_ENV","production");vi.stubEnv("FOLLOWUP_SEND_ENABLED","true");vi.stubEnv("RESEND_API_KEY","fictional-test-key");vi.stubEnv("RESEND_FROM_EMAIL","Orbisy <info@orbisy.example>");vi.stubEnv("FOLLOWUP_TOKEN_ENCRYPTION_KEY",Buffer.alloc(32,3).toString("base64"));vi.stubEnv("GMAIL_CLIENT_ID","fictional-client");vi.stubEnv("GMAIL_CLIENT_SECRET","fictional-client-secret");vi.stubEnv("FOLLOWUP_RESEND_WEBHOOK_SECRET","whsec_"+Buffer.alloc(32,4).toString("base64"));vi.stubEnv("FOLLOWUP_POSTAL_ADDRESS","Fictional business mailing address");vi.stubEnv("FOLLOWUP_UNSUBSCRIBE_SECRET","fictional-stop-link-key-at-least-32-characters");});
afterEach(()=>{vi.useRealTimers();vi.unstubAllEnvs();vi.unstubAllGlobals();vi.restoreAllMocks();});afterAll(async()=>pg.close());
async function inquiry(email=`qa-${crypto.randomUUID()}@example.test`,submittedAt=new Date()){const [submission]=await mocks.db.insert(schema.contactSubmissions).values({type:"project_request",name:"Example Owner",businessName:"Example Association",email,consentVersion:"test",submittedAt,idempotencyKey:crypto.randomUUID()}).returning();const [lead]=await mocks.db.insert(schema.leads).values({submissionId:submission.id,businessName:submission.businessName,email,sourceName:"Inbound consultation",status:"new_inbound"}).returning();return {submission,lead};}
async function enroll(){const row=await inquiry();expect(await enrollInquiry(row.lead.id,"owner@example.test")).toBe(true);const [conversation]=await mocks.db.select().from(schema.followupConversations).where(eq(schema.followupConversations.leadId,row.lead.id));const [message]=await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.conversationId,conversation.id));return {...row,conversation,message};}
async function approve(id:string){const [message]=await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.id,id));const form=new FormData();Object.entries({id,subject:message.subject,body:message.body}).forEach(([k,v])=>form.set(k,v));return approveFollowupAction(initial,form);}
async function healthyGmail(){await getFollowupSettings();await mocks.db.update(schema.followupSettings).set({sendingEnabled:true,gmailTokenCiphertext:encryptGmailToken("fictional-refresh-token"),gmailCursor:"100",gmailSyncedAt:new Date(),gmailError:null}).where(eq(schema.followupSettings.id,"main"));}
function mockedProvider(resendStatuses=[200]){const payloads:Array<{body:string;key:string}>=[];let count=0;const request=vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{const url=String(input);if(url==="https://api.resend.com/emails"){payloads.push({body:String(init?.body),key:String((init?.headers as Record<string,string>)["Idempotency-Key"])});const status=resendStatuses[Math.min(count++,resendStatuses.length-1)];return new Response(JSON.stringify({id:`provider-${count}`}),{status});}if(url==="https://oauth2.googleapis.com/token")return Response.json({access_token:"fictional-access"});if(url.endsWith("/profile"))return Response.json({emailAddress:"info@orbisy.com",historyId:"101"});if(url.includes("/history?"))return Response.json({historyId:"101"});throw Error("Unexpected external request in test");});vi.stubGlobal("fetch",request);return {request,payloads};}
async function enableDigest(now="2026-11-19T00:00:00Z"){vi.setSystemTime(new Date(now));await healthyGmail();await mocks.db.update(schema.followupSettings).set({digestEnabled:true,digestHour:18}).where(eq(schema.followupSettings.id,"main"));}
describe("Private inbound follow-up workflow",()=>{
 it("identifies the Gmail request stage and HTTP status without storing provider response bodies",async()=>{
  await healthyGmail();const provider=mockedProvider();const logs=vi.spyOn(console,"error").mockImplementation(()=>{});
  vi.stubGlobal("fetch",vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>String(input).includes("/history?")?Response.json({error:"PRIVATE_PROVIDER_DETAILS"},{status:404}):provider.request(input,init)));
  expect(await syncGmail()).toBe(false);const settings=await getFollowupSettings();
  expect(settings.gmailError).toContain("mailbox history: Gmail history request failed (HTTP 404)");
  expect(JSON.stringify([settings.gmailError,logs.mock.calls])).not.toContain("PRIVATE_PROVIDER_DETAILS");
 });
 it("processes later replies when a message referenced by history is no longer available",async()=>{
  const {submission,conversation}=await enroll();
  await healthyGmail();
  const provider=mockedProvider();
  const log=vi.spyOn(console,"info").mockImplementation(()=>{});
  vi.stubGlobal("fetch",vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{
   const url=String(input);
   if(url.includes("/history?"))return Response.json({historyId:"102",history:[{messagesAdded:[{message:{id:"deleted"}},{message:{id:"reply"}}]}]});
   if(url.includes("/messages/deleted?"))return new Response("PRIVATE_PROVIDER_DETAILS",{status:404});
   if(url.includes("/messages/reply?"))return Response.json({id:"reply",internalDate:String(Date.now()+1000),payload:{headers:[{name:"From",value:submission.email}]}});
   return provider.request(input,init);
  }));
  expect(await syncGmail()).toBe(true);
  expect((await getFollowupSettings()).gmailCursor).toBe("102");
  const [saved]=await mocks.db.select().from(schema.followupConversations).where(eq(schema.followupConversations.id,conversation.id));
  expect(saved.state).toBe("paused");
  expect(JSON.stringify(log.mock.calls)).not.toMatch(/deleted|PRIVATE_PROVIDER_DETAILS/);
 });
 it("keeps token refresh failures distinct from metadata failures and redacts raw exception text",async()=>{
  await healthyGmail();const provider=mockedProvider();const logs=vi.spyOn(console,"error").mockImplementation(()=>{});
  vi.stubGlobal("fetch",vi.fn(async()=>Response.json({error:"PRIVATE_TOKEN_RESPONSE"},{status:400})));
  expect(await syncGmail()).toBe(false);expect((await getFollowupSettings()).gmailError).toContain("token refresh: Gmail token request failed (HTTP 400)");
  vi.stubGlobal("fetch",vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>String(input).includes("/history?")?Promise.reject(Error("PRIVATE_DATABASE_PARAMETERS",{cause:{code:"ERR_INVALID_ARG_TYPE"}})):provider.request(input,init)));
  expect(await syncGmail()).toBe(false);expect((await getFollowupSettings()).gmailError).toContain("mailbox history: ERR_INVALID_ARG_TYPE");
  expect(JSON.stringify(logs.mock.calls)).not.toMatch(/PRIVATE_TOKEN_RESPONSE|PRIVATE_DATABASE_PARAMETERS/);
 });

 it("delivers branded customer emails and freezes the HTML, address, and preference link across retries",async()=>{
  const {message}=await enroll();await healthyGmail();await approve(message.id);
  vi.stubEnv("FOLLOWUP_POSTAL_ADDRESS","123 Example St\nExample City, IL 60000");
  const provider=mockedProvider([503,200]);expect(await deliverFollowupMessage(message.id)).toBe(false);
  const [frozen]=await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.id,message.id));
  const payload=frozen.deliveryPayload as {html:string;text:string;headers:Record<string,string>};
  expect(payload.html).toContain(">Stop These Follow Ups</a>");expect(payload.html).toContain("123 Example St<br>Example City, IL 60000");
  expect(payload.html).toContain("https://www.orbisy.com/email-preferences?token=");
  expect(payload.headers["List-Unsubscribe"]).toContain("/api/followups/unsubscribe?token=");
  expect(payload.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  vi.setSystemTime(new Date("2026-11-18T18:06:00Z"));await healthyGmail();vi.stubEnv("FOLLOWUP_POSTAL_ADDRESS","A changed address");
  expect(await deliverFollowupMessage(message.id)).toBe(true);expect(provider.payloads[0]).toEqual(provider.payloads[1]);
 });
 it("keeps the dedicated preference page private and read-only until confirmation, then cancels unsent mail idempotently",async()=>{
  const {conversation,submission}=await enroll();const token=new URL(unsubscribeUrl(conversation.id)).searchParams.get("token")!;
  const page=await preferenceGet(new Request(`https://www.orbisy.com/email-preferences?token=${token}`));
  expect(page.status).toBe(200);expect(page.headers.get("Referrer-Policy")).toBe("no-referrer");expect(page.headers.get("Cache-Control")).toBe("no-store");
  expect(page.headers.get("X-Robots-Tag")).toContain("noindex");
  const html=await page.text();expect(html).toContain('action="/email-preferences"');expect(html).toContain(">Stop These Follow Ups</button>");expect(html).not.toContain("<script");expect(html).not.toContain("googletagmanager");
  expect((await mocks.db.select().from(schema.followupConversations).where(eq(schema.followupConversations.id,conversation.id)))[0].state).toBe("needs_response");
  for(let attempt=0;attempt<2;attempt++){
   const response=await preferencePost(new Request("https://www.orbisy.com/email-preferences",{method:"POST",body:new URLSearchParams({token})}));
   expect(response.status).toBe(200);expect(await response.text()).toContain("Automated follow-ups stopped.");
  }
  expect((await mocks.db.select().from(schema.suppressionEntries).where(eq(schema.suppressionEntries.normalizedEmail,submission.email)))).toHaveLength(1);
  expect((await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.conversationId,conversation.id))).every(m=>m.status==="cancelled")).toBe(true);
 });
 it("handles invalid links and save failures without reporting a successful opt-out",async()=>{
  const invalid=await preferenceGet(new Request("https://www.orbisy.com/email-preferences?token=invalid"));expect(invalid.status).toBe(400);expect(await invalid.text()).toContain("info@orbisy.com");
  const {conversation}=await enroll();const token=new URL(unsubscribeUrl(conversation.id)).searchParams.get("token")!;
  vi.spyOn(mocks.db,"transaction").mockRejectedValueOnce(Error("Database unavailable"));
  const failed=await preferencePost(new Request("https://www.orbisy.com/email-preferences",{method:"POST",body:new URLSearchParams({token})}));
  expect(failed.status).toBe(503);expect(await failed.text()).toContain("We couldn’t save your preference.");
  expect((await mocks.db.select().from(schema.followupConversations).where(eq(schema.followupConversations.id,conversation.id)))[0].state).toBe("needs_response");
  vi.stubEnv("VERCEL_ENV","preview");expect((await preferencePost(new Request("https://www.orbisy.com/email-preferences",{method:"POST",body:new URLSearchParams({token})}))).status).toBe(404);
 });
 it("claims an available or expired worker lease, leaves a live lease alone, and runs with sending disabled",async()=>{
  const provider=mockedProvider();await healthyGmail();vi.stubEnv("FOLLOWUP_SEND_ENABLED","false");
  expect(await runFollowupWorker()).toMatchObject({status:"sending_disabled",sent:0,enrolled:0});
  expect(await getFollowupSettings()).toMatchObject({lastWorkerAt:new Date(),workerLease:null,workerLeaseUntil:null});
  await mocks.db.update(schema.followupSettings).set({workerLease:"11111111-1111-4111-8111-111111111111",workerLeaseUntil:new Date(Date.now()+60000)});
  expect(await runFollowupWorker()).toMatchObject({status:"already_running",sent:0});
  expect((await getFollowupSettings()).workerLease).toBe("11111111-1111-4111-8111-111111111111");
  vi.setSystemTime(new Date(Date.now()+60001));
  expect(await runFollowupWorker()).toMatchObject({status:"sending_disabled",sent:0});
  expect((await getFollowupSettings()).workerLease).toBeNull();expect(provider.payloads).toHaveLength(0);
 });
 it("does not deliver an approved retry until its retry time, then accepts it once",async()=>{
  const {message}=await enroll();await healthyGmail();await approve(message.id);const provider=mockedProvider();
  await mocks.db.update(schema.followupMessages).set({nextAttemptAt:new Date(Date.now()+60000)}).where(eq(schema.followupMessages.id,message.id));
  expect(await runFollowupWorker()).toMatchObject({status:"complete",sent:0});expect(provider.payloads).toHaveLength(0);
  vi.setSystemTime(new Date(Date.now()+60000));
  expect(await runFollowupWorker()).toMatchObject({status:"complete",sent:1});
  expect(await runFollowupWorker()).toMatchObject({status:"complete",sent:0});expect(provider.payloads).toHaveLength(1);
 });
 it("honors a temporary suppression until its expiry without losing the inquiry",async()=>{
  const {lead,submission}=await inquiry();const expiresAt=new Date(Date.now()+60000);
  await mocks.db.insert(schema.suppressionEntries).values({normalizedEmail:submission.email,type:"email",reason:"Temporary hold",expiresAt});
  expect(await enrollInquiry(lead.id,"owner")).toBe(false);
  vi.setSystemTime(expiresAt);expect(await enrollInquiry(lead.id,"owner")).toBe(true);
 });
 it("returns an observable 503 for a startup failure without logging query parameters or clearing another lease",async()=>{
  await getFollowupSettings();await mocks.db.update(schema.followupSettings).set({workerLease:"11111111-1111-4111-8111-111111111111",workerLeaseUntil:new Date(Date.now()+60000)});
  vi.stubEnv("FOLLOWUP_CRON_SECRET","fictional-test-worker-secret-at-least-32-characters");
  const logs=vi.spyOn(console,"error").mockImplementation(()=>{});
  vi.spyOn(mocks.db,"update").mockImplementationOnce(()=>{throw new Error("private-query-parameter",{cause:{code:"ERR_INVALID_ARG_TYPE"}});});
  const response=await workerRoute(new Request("https://www.orbisy.com/api/internal/followups",{method:"POST",headers:{authorization:`Bearer ${process.env.FOLLOWUP_CRON_SECRET}`}}));
  expect(response.status).toBe(503);expect(await response.json()).toMatchObject({status:"needs_attention",sent:0});
  const events=await mocks.db.select().from(schema.followupEvents);expect(events[0]).toMatchObject({kind:"worker_error"});expect(events[0].detail).toContain("startup (ERR_INVALID_ARG_TYPE)");
  expect(JSON.stringify([events,logs.mock.calls])).not.toContain("private-query-parameter");expect((await getFollowupSettings()).workerLease).toBe("11111111-1111-4111-8111-111111111111");
 });
 it("releases its own lease after a processing failure and does not send",async()=>{
  const provider=mockedProvider();await healthyGmail();vi.spyOn(console,"error").mockImplementation(()=>{});
  vi.spyOn(mocks.db,"transaction").mockRejectedValueOnce(Error("Unavailable"));
  expect(await runFollowupWorker()).toMatchObject({status:"needs_attention",sent:0});
  expect((await getFollowupSettings()).workerLease).toBeNull();expect(provider.payloads).toHaveLength(0);
  expect((await mocks.db.select().from(schema.followupEvents))[0].detail).toContain("processing");
 });
 it("returns needs attention when the database cannot initialize or save an error",async()=>{
  const logs=vi.spyOn(console,"error").mockImplementation(()=>{});
  mocks.getDb.mockImplementationOnce(()=>{throw Error("private-connection-string");}).mockImplementationOnce(()=>{throw Error("private-connection-string");});
  expect(await runFollowupWorker()).toMatchObject({status:"needs_attention",sent:0});
  expect(logs).toHaveBeenCalledTimes(2);expect(JSON.stringify(logs.mock.calls)).not.toContain("private-connection-string");
 });
 it("reports lease release failure and leaves the lease to expire without sending",async()=>{
  const provider=mockedProvider();await healthyGmail();vi.stubEnv("FOLLOWUP_SEND_ENABLED","false");vi.spyOn(console,"error").mockImplementation(()=>{});
  const logQuery=postgresDateSerialization.logQuery.bind(postgresDateSerialization);let failed=false;
  vi.spyOn(postgresDateSerialization,"logQuery").mockImplementation((query,params)=>{logQuery(query,params);if(!failed&&query.startsWith('update "followup_settings" set "worker_lease"')&&params[0]===null){failed=true;throw Error("Release unavailable");}});
  expect(await runFollowupWorker()).toMatchObject({status:"needs_attention",sent:0});
  expect((await getFollowupSettings()).workerLease).toBeTruthy();expect(provider.payloads).toHaveLength(0);
  expect((await mocks.db.select().from(schema.followupEvents))[0].detail).toContain("lease release");
 });
 it("preserves existing records and prices, starts off, and does not enroll historical inquiries on its own",async()=>{expect((await pg.query("select amount_cents,status from pricing_entries where name='Preserved price'")).rows[0]).toEqual({amount_cents:450000,status:"active"});expect((await pg.query("select status from leads where source_name='Legacy fixture'")).rows[0]).toEqual({status:"proposal_sent"});const settings=await getFollowupSettings();expect(settings).toMatchObject({enrollmentEnabled:false,sendingEnabled:false,autoAcknowledge:false,gmailTokenCiphertext:null});await inquiry();expect(await enrollNewInquiries()).toBe(0);});
 it("enrolls an inquiry only once and prevents simultaneous open sequences for the same email or imported/suppressed records",async()=>{const a=await enroll();expect(await enrollInquiry(a.lead.id,"owner")).toBe(false);const duplicate=await inquiry(a.submission.email);expect(await enrollInquiry(duplicate.lead.id,"owner")).toBe(false);const [imported]=await mocks.db.select().from(schema.leads).where(eq(schema.leads.sourceName,"Legacy fixture"));expect(await enrollInquiry(imported.id,"owner")).toBe(false);const blocked=await inquiry();await mocks.db.insert(schema.suppressionEntries).values({normalizedEmail:blocked.submission.email,type:"email",reason:"Do not contact"});expect(await enrollInquiry(blocked.lead.id,"owner")).toBe(false);});
 it("uses the activation cutoff and keeps stale acknowledgments in draft",async()=>{const old=await inquiry(undefined,new Date("2026-11-18T16:00:00Z"));const stale=await inquiry(undefined,new Date("2026-11-18T17:40:00Z"));const fresh=await inquiry();await getFollowupSettings();await mocks.db.update(schema.followupSettings).set({enrollmentEnabled:true,activatedAt:new Date("2026-11-18T17:00:00Z"),autoAcknowledge:true}).where(eq(schema.followupSettings.id,"main"));expect(await enrollNewInquiries()).toBe(2);const rows=await mocks.db.select().from(schema.followupConversations);expect(rows.some(c=>c.leadId===old.lead.id)).toBe(false);for(const [row,status] of [[stale,"draft"],[fresh,"approved"]] as const){const c=rows.find(c=>c.leadId===row.lead.id)!;expect((await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.conversationId,c.id)))[0].status).toBe(status);}});
 it("requires explicit approval, production sending, and healthy Gmail before any customer email",async()=>{const {message}=await enroll();const provider=mockedProvider();await healthyGmail();expect(await deliverFollowupMessage(message.id)).toBe(false);expect((await approve(message.id)).success).toBe(true);vi.stubEnv("FOLLOWUP_SEND_ENABLED","false");expect(await deliverFollowupMessage(message.id)).toBe(false);vi.stubEnv("FOLLOWUP_SEND_ENABLED","true");vi.stubEnv("VERCEL_ENV","preview");expect(await deliverFollowupMessage(message.id)).toBe(false);vi.stubEnv("VERCEL_ENV","production");await mocks.db.update(schema.followupSettings).set({gmailError:"Sync blocked"});expect(await deliverFollowupMessage(message.id)).toBe(false);expect(provider.payloads).toHaveLength(0);await healthyGmail();expect(await deliverFollowupMessage(message.id)).toBe(true);expect(provider.payloads).toHaveLength(1);expect((await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.id,message.id)))[0].status).toBe("accepted");});
 it("freezes payloads before the first attempt and reuses the same idempotency key during a bounded retry",async()=>{const {message}=await enroll();await healthyGmail();await approve(message.id);const provider=mockedProvider([503,200]);expect(await deliverFollowupMessage(message.id)).toBe(false);let [row]=await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.id,message.id));expect(row.firstAttemptAt).toBeInstanceOf(Date);expect(row.deliveryPayload).toBeTruthy();expect((await approve(message.id)).success).toBe(false);vi.setSystemTime(new Date("2026-11-18T18:06:00Z"));await healthyGmail();vi.stubEnv("RESEND_FROM_EMAIL","Changed sender <other@orbisy.example>");expect(await deliverFollowupMessage(message.id)).toBe(true);expect(provider.payloads[0]).toEqual(provider.payloads[1]);[row]=await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.id,message.id));expect(row.attempts).toBe(2);});
 it("blocks blind retries after 23 hours",async()=>{const {message}=await enroll();await healthyGmail();await approve(message.id);const provider=mockedProvider();await mocks.db.update(schema.followupMessages).set({firstAttemptAt:new Date("2026-11-17T18:00:00Z")}).where(eq(schema.followupMessages.id,message.id));expect(await deliverFollowupMessage(message.id)).toBe(false);expect(provider.payloads).toHaveLength(0);expect((await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.id,message.id)))[0].status).toBe("uncertain");});
 it("records a personal response once, drafts two reminders, and pauses on an inbound reply without copying the email body",async()=>{const {conversation,submission,message}=await enroll();await approve(message.id);expect(await recordPersonalResponse(conversation.id,"owner")).toBe(true);expect(await recordPersonalResponse(conversation.id,"owner")).toBe(false);expect((await mocks.db.select().from(schema.leads).where(eq(schema.leads.id,conversation.leadId)))[0].status).toBe("contacted");let rows=await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.conversationId,conversation.id));expect(rows.map(m=>m.status).sort()).toEqual(["cancelled","draft","draft"]);expect(rows.find(m=>m.kind==="followup_one")?.dueAt.toISOString()).toBe("2026-11-20T18:00:00.000Z");const metadata={id:"gmail-reply",internalDate:String(Date.now()+60000),labelIds:["INBOX"],payload:{headers:[{name:"From",value:`Example <${submission.email}>`}],body:{data:"NEVER_COPY_THIS"}}};await applyGmailMetadata(metadata);await applyGmailMetadata(metadata);expect((await mocks.db.select().from(schema.followupConversations).where(eq(schema.followupConversations.id,conversation.id)))[0]).toMatchObject({state:"paused"});rows=await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.conversationId,conversation.id));expect(rows.every(m=>m.status==="cancelled")).toBe(true);const events=await mocks.db.select().from(schema.followupEvents);expect(events.filter(e=>e.externalKey?.startsWith("gmail:gmail-reply"))).toHaveLength(1);expect((await mocks.db.select().from(schema.leads).where(eq(schema.leads.id,conversation.leadId)))[0].status).toBe("replied");expect(JSON.stringify(events)).not.toContain("NEVER_COPY_THIS");});
 it("detects a reply received between form submission and worker enrollment",async()=>{const row=await inquiry(undefined,new Date("2026-11-18T17:55:00Z"));await enrollInquiry(row.lead.id,"owner");await applyGmailMetadata({id:"before-enrollment-reply",internalDate:String(new Date("2026-11-18T17:57:00Z").getTime()),labelIds:["INBOX"],payload:{headers:[{name:"From",value:row.submission.email}]}});expect((await mocks.db.select().from(schema.followupConversations).where(eq(schema.followupConversations.leadId,row.lead.id)))[0].state).toBe("paused");});
 it("pauses when a new personal SENT message or terminal lead status is detected",async()=>{const a=await enroll();await applyGmailMetadata({id:"personal-gmail",internalDate:String(Date.now()+1000),labelIds:["SENT"],payload:{headers:[{name:"From",value:"info@orbisy.com"},{name:"To",value:a.submission.email}]}});expect((await mocks.db.select().from(schema.followupConversations).where(eq(schema.followupConversations.id,a.conversation.id)))[0].state).toBe("paused");const b=await enroll();await mocks.db.update(schema.leads).set({status:"won"}).where(eq(schema.leads.id,b.lead.id));vi.stubEnv("FOLLOWUP_SEND_ENABLED","false");await runFollowupWorker();expect((await mocks.db.select().from(schema.followupConversations).where(eq(schema.followupConversations.id,b.conversation.id)))[0].state).toBe("paused");});
 it("stops all unsent emails and suppresses the contact when a signed preference link is confirmed, while GET alone is read-only",async()=>{const {conversation,submission}=await enroll();const url=unsubscribeUrl(conversation.id);expect((await unsubscribeGet(new Request(url))).status).toBe(200);expect((await mocks.db.select().from(schema.followupConversations).where(eq(schema.followupConversations.id,conversation.id)))[0].state).toBe("needs_response");expect((await unsubscribePost(new Request(url,{method:"POST"}))).status).toBe(200);expect((await mocks.db.select().from(schema.followupConversations).where(eq(schema.followupConversations.id,conversation.id)))[0].state).toBe("paused");expect((await mocks.db.select().from(schema.suppressionEntries).where(eq(schema.suppressionEntries.normalizedEmail,submission.email))).length).toBe(1);});
 it("reconciles an early bounce event after provider acceptance and blocks the conversation",async()=>{const {conversation,message,submission}=await enroll();await healthyGmail();await approve(message.id);const provider=mockedProvider();await mocks.db.insert(schema.followupEvents).values({externalKey:"resend:early-bounce",providerEmailId:"provider-1",kind:"email.bounced",detail:"Bounced"});await deliverFollowupMessage(message.id);await reconcileDeliveryEvents();expect(provider.payloads).toHaveLength(1);expect((await mocks.db.select().from(schema.followupConversations).where(eq(schema.followupConversations.id,conversation.id)))[0].state).toBe("paused");expect((await mocks.db.select().from(schema.suppressionEntries).where(eq(schema.suppressionEntries.normalizedEmail,submission.email))).length).toBe(1);});
 it("deduplicates the daily owner digest and reports Gmail sync failure without sending",async()=>{await enableDigest();await enroll();expect(await queueDailyDigest()).toBe(true);expect(await queueDailyDigest()).toBe(false);const [digest]=await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.kind,"digest"));const provider=mockedProvider();vi.stubGlobal("fetch",vi.fn().mockRejectedValue(Error("Offline")));expect(await syncGmail()).toBe(false);expect(await deliverFollowupMessage(digest.id)).toBe(false);expect(provider.payloads).toHaveLength(0);});
 it("skips an empty evening without consuming the day's digest, then sends once when action appears",async()=>{
  await enableDigest();const provider=mockedProvider();
  expect(await queueDailyDigest()).toBe(false);expect((await mocks.db.select().from(schema.followupMessages)).length).toBe(0);
  await enroll();expect(await queueDailyDigest()).toBe(true);
  const [digest]=await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.kind,"digest"));
  expect(digest.recipientEmail).toBe("info@orbisy.com");
  expect(await deliverFollowupMessage(digest.id)).toBe(true);
  expect(await queueDailyDigest()).toBe(false);expect(await deliverFollowupMessage(digest.id)).toBe(false);
  expect(provider.payloads).toHaveLength(1);expect((await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.kind,"digest")))).toHaveLength(1);
  const view=await getFollowupOverview();expect(view.latestDigest).toMatchObject({id:digest.id,status:"accepted",attempts:1});
  expect(view.latestDigest).not.toHaveProperty("body");expect(view.latestDigest).not.toHaveProperty("deliveryPayload");
 });
 it("skips closed, paused without replies, blocked, completed, and already approved work",async()=>{
  await enableDigest();
  const closed=await enroll();await mocks.db.update(schema.followupConversations).set({state:"closed"}).where(eq(schema.followupConversations.id,closed.conversation.id));
  const paused=await enroll();await mocks.db.update(schema.followupConversations).set({state:"paused"}).where(eq(schema.followupConversations.id,paused.conversation.id));
  const blocked=await enroll();await mocks.db.insert(schema.suppressionEntries).values({normalizedEmail:blocked.submission.email,type:"email",reason:"Do not contact"});
  const won=await enroll();await mocks.db.update(schema.leads).set({status:"won"}).where(eq(schema.leads.id,won.lead.id));
  const waiting=await enroll();await recordPersonalResponse(waiting.conversation.id,"owner");
  await mocks.db.update(schema.followupMessages).set({status:"approved",approvedAt:new Date(),approvedBy:"owner"}).where(and(eq(schema.followupMessages.conversationId,waiting.conversation.id),inArray(schema.followupMessages.kind,["followup_one","followup_two"])));
  expect(await queueDailyDigest()).toBe(false);expect((await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.kind,"digest")))).toHaveLength(0);
 });
 it("reports actionable counts beyond the five-item display limit with safe names and saved-inquiry links",async()=>{
  await enableDigest();const emails:string[]=[];
  for(let i=0;i<7;i++){const row=await enroll();emails.push(row.submission.email);await mocks.db.update(schema.leads).set({businessName:"Example\nAssociation "+i}).where(eq(schema.leads.id,row.lead.id));}
  expect(await queueDailyDigest()).toBe(true);const [digest]=await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.kind,"digest"));
  expect(digest.body).toContain("Inquiries needing your personal response: 7");expect(digest.body).toContain("Email drafts awaiting approval: 7");
  expect(digest.body).toContain("Plus 2 more in the follow-up inbox.");expect(digest.body).toContain("Example Association ");
  expect(digest.body).not.toContain("Example\nAssociation");expect(digest.body).toContain("https://www.orbisy.com/admin-portal/leads/");
  for(const email of emails)expect(digest.body).not.toContain(email);
 });
 it("excludes active suppressions while allowing expired holds back into the owner summary",async()=>{
  await enableDigest();const blocked=await enroll(),expired=await enroll();
  await mocks.db.update(schema.leads).set({businessName:"Active hold association"}).where(eq(schema.leads.id,blocked.lead.id));
  await mocks.db.update(schema.leads).set({businessName:"Expired hold association"}).where(eq(schema.leads.id,expired.lead.id));
  await mocks.db.insert(schema.suppressionEntries).values([{normalizedEmail:blocked.submission.email,type:"email",reason:"Hold",expiresAt:new Date(Date.now()+60000)},{normalizedEmail:expired.submission.email,type:"email",reason:"Old hold",expiresAt:new Date(Date.now()-60000)}]);
  expect(await queueDailyDigest()).toBe(true);const [digest]=await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.kind,"digest"));
  expect(digest.body).toContain("Inquiries needing your personal response: 1");expect(digest.body).toContain("Expired hold association");expect(digest.body).not.toContain("Active hold association");
 });
 it("cancels an unattempted summary if its actions disappear and can reuse that unsent slot later the same evening",async()=>{
  await enableDigest();const first=await enroll();expect(await queueDailyDigest()).toBe(true);
  const [digest]=await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.kind,"digest"));
  const close=new FormData();close.set("id",first.conversation.id);close.set("action","close");expect((await followupConversationAction(initial,close)).success).toBe(true);
  expect(await queueDailyDigest()).toBe(false);expect((await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.id,digest.id)))[0].status).toBe("cancelled");
  await enroll();expect(await queueDailyDigest()).toBe(false);
  const provider=mockedProvider();expect(await deliverFollowupMessage(digest.id)).toBe(true);expect(provider.payloads).toHaveLength(1);
  expect((await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.kind,"digest")))).toHaveLength(1);
 });
 it("rechecks actionability at first delivery so an already resolved summary is not emailed",async()=>{
  await enableDigest();const row=await enroll();await queueDailyDigest();
  const [digest]=await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.kind,"digest"));
  const close=new FormData();close.set("id",row.conversation.id);close.set("action","close");await followupConversationAction(initial,close);
  const provider=mockedProvider();expect(await deliverFollowupMessage(digest.id)).toBe(false);expect(provider.payloads).toHaveLength(0);
  expect((await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.id,digest.id)))[0]).toMatchObject({status:"cancelled",attempts:0,firstAttemptAt:null});
 });
 it("keeps an attempted digest's payload immutable while retrying under the same provider key",async()=>{
  await enableDigest();await enroll();await queueDailyDigest();
  const [digest]=await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.kind,"digest"));
  const provider=mockedProvider([503,200]);expect(await deliverFollowupMessage(digest.id)).toBe(false);
  const frozen=(await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.id,digest.id)))[0];
  await enroll();await queueDailyDigest();vi.setSystemTime(new Date(Date.now()+6*60000));await healthyGmail();
  expect(await deliverFollowupMessage(digest.id)).toBe(true);expect(provider.payloads).toHaveLength(2);expect(provider.payloads[0]).toEqual(provider.payloads[1]);
  expect((await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.id,digest.id)))[0].deliveryPayload).toEqual(frozen.deliveryPayload);
 });
 it.each([
  ["winter","2026-11-18T23:59:00Z","2026-11-19T00:00:00Z","2026-11-19T03:00:00Z","digest:2026-11-18"],
  ["summer","2026-07-15T22:59:00Z","2026-07-15T23:00:00Z","2026-07-16T02:00:00Z","digest:2026-07-15"],
 ])("uses the Chicago 6 p.m. window in %s and stops at 9 p.m.",async(_season,before,evening,closed,key)=>{
  await enableDigest(before);await enroll();expect(await queueDailyDigest()).toBe(false);
  vi.setSystemTime(new Date(evening));expect(await queueDailyDigest()).toBe(true);
  const [digest]=await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.kind,"digest"));expect(digest.dedupKey).toBe(key);
  vi.setSystemTime(new Date(closed));await healthyGmail();const provider=mockedProvider();expect(await deliverFollowupMessage(digest.id)).toBe(false);expect(provider.payloads).toHaveLength(0);
  expect(await queueDailyDigest()).toBe(false);expect((await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.id,digest.id)))[0].status).toBe("cancelled");
 });
 it("never sends yesterday's summary as a catch-up and respects disabling the digest",async()=>{
  await enableDigest();await enroll();await queueDailyDigest();
  const [old]=await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.kind,"digest"));
  vi.setSystemTime(new Date("2026-11-20T00:00:00Z"));await healthyGmail();const provider=mockedProvider();
  expect(await deliverFollowupMessage(old.id)).toBe(false);expect(await queueDailyDigest()).toBe(true);
  expect((await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.id,old.id)))[0].status).toBe("cancelled");
  await mocks.db.update(schema.followupSettings).set({digestEnabled:false});expect(await queueDailyDigest()).toBe(false);
  expect((await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.status,"approved"))).filter(m=>m.kind==="digest")).toHaveLength(0);expect(provider.payloads).toHaveLength(0);
 });
 it("does not queue a digest when Gmail synchronization fails",async()=>{
  await enableDigest();await enroll();vi.stubGlobal("fetch",vi.fn().mockRejectedValue(Error("Offline")));
  expect(await runFollowupWorker()).toMatchObject({status:"gmail_sync_required",sent:0});
  expect((await mocks.db.select().from(schema.followupMessages).where(eq(schema.followupMessages.kind,"digest")))).toHaveLength(0);
 });
 it("builds and sends the owner summary after processing fresh Gmail replies",async()=>{
  await enableDigest();const row=await enroll();const provider=mockedProvider();
  vi.stubGlobal("fetch",vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{
   const url=String(input);
   if(url.includes("/history?"))return Response.json({historyId:"101",history:[{messagesAdded:[{message:{id:"new-digest-reply"}}]}]});
   if(url.includes("/messages/"))return Response.json({id:"new-digest-reply",internalDate:String(Date.now()+1),labelIds:["INBOX"],payload:{headers:[{name:"From",value:row.submission.email}]}});
   return provider.request(input,init);
  }));
  expect(await runFollowupWorker()).toMatchObject({status:"complete",sent:1});
  expect(provider.payloads).toHaveLength(1);const payload=JSON.parse(provider.payloads[0].body);
  expect(payload.to).toEqual(["info@orbisy.com"]);expect(payload.text).toContain("Inquiries needing your personal response: 0");expect(payload.text).toContain("Replies paused for your review: 1");expect(payload.text).toContain("Email drafts awaiting approval: 0");
 });
 it("requires administrator authorization before data or mutations and protects worker/webhook routes",async()=>{for(const task of [()=>getFollowupOverview(),()=>enrollFollowupAction(initial,new FormData()),()=>followupConversationAction(initial,new FormData()),()=>approveFollowupAction(initial,new FormData()),()=>saveFollowupSettingsAction(initial,new FormData()),()=>runFollowupsAction()]){mocks.getDb.mockClear();mocks.admin.mockRejectedValueOnce(Error("Unauthorized"));await expect(task()).rejects.toThrow("Unauthorized");expect(mocks.getDb).not.toHaveBeenCalled();}expect((await workerRoute(new Request("https://www.orbisy.com/api/internal/followups",{method:"POST"}))).status).toBe(401);expect((await deliveryRoute(new Request("https://www.orbisy.com/api/followups/delivery",{method:"POST",body:'{}'}))).status).toBe(400);});
 it("uses Google authorization state, rejects the wrong mailbox, and encrypts a valid connection while leaving sending off",async()=>{
 const fetch=vi.fn(async(input:RequestInfo|URL)=>String(input)==="https://oauth2.googleapis.com/token"?Response.json({access_token:"fictional-access",refresh_token:"fictional-refresh",scope:"https://www.googleapis.com/auth/gmail.metadata"}):Response.json({emailAddress:"wrong@example.test",historyId:"100"}));vi.stubGlobal("fetch",fetch);
 expect((await gmailStart(new Request("https://www.orbisy.com/api/admin/followups/gmail/start",{method:"POST",headers:{origin:"https://www.orbisy.com"}}))).status).toBe(401);
 mocks.identity.mockResolvedValue({email:"owner@example.test"});
 expect((await gmailStart(new Request("https://www.orbisy.com/api/admin/followups/gmail/start",{method:"POST",headers:{origin:"https://untrusted.example"}}))).status).toBe(409);
 mocks.cookies.set("__Host-orbisy_gmail_oauth_state","a".repeat(64));
 expect((await gmailCallback(new Request("https://www.orbisy.com/api/admin/followups/gmail/callback?state="+"b".repeat(64)+"&code=fictional"))).headers.get("location")).toContain("gmail_failed");expect(fetch).not.toHaveBeenCalled();
 const start=await gmailStart(new Request("https://www.orbisy.com/api/admin/followups/gmail/start",{method:"POST",headers:{origin:"https://www.orbisy.com"}}));const state=new URL(start.headers.get("location")!).searchParams.get("state")!;
 expect(new URL(start.headers.get("location")!).searchParams.get("scope")).toBe("https://www.googleapis.com/auth/gmail.metadata");
 expect(start.status).toBe(303);expect(start.headers.get("cache-control")).toBe("no-store");
 expect((await gmailCallback(new Request(`https://www.orbisy.com/api/admin/followups/gmail/callback?state=${state}&code=fictional`))).headers.get("location")).toContain("gmail_failed");
 expect((await getFollowupSettings()).gmailTokenCiphertext).toBeNull();
 const second=await gmailStart(new Request("https://www.orbisy.com/api/admin/followups/gmail/start",{method:"POST",headers:{origin:"https://www.orbisy.com"}}));const state2=new URL(second.headers.get("location")!).searchParams.get("state")!;
 fetch.mockImplementation(async(input:RequestInfo|URL)=>String(input)==="https://oauth2.googleapis.com/token"?Response.json({access_token:"fictional-access",refresh_token:"fictional-refresh",scope:"https://www.googleapis.com/auth/gmail.metadata"}):Response.json({emailAddress:"info@orbisy.com",historyId:"100"}));
 expect((await gmailCallback(new Request(`https://www.orbisy.com/api/admin/followups/gmail/callback?state=${state2}&code=fictional`))).headers.get("location")).toContain("gmail_connected");
 const settings=await getFollowupSettings();expect(settings.gmailTokenCiphertext).toBeTruthy();expect(settings.gmailTokenCiphertext).not.toContain("fictional-refresh");expect(settings).toMatchObject({enrollmentEnabled:false,sendingEnabled:false,autoAcknowledge:false});expect(mocks.cookies.get("__Host-orbisy_gmail_oauth_state")).toBe("");
 });
 it("returns an uncached authorization URL for the enhanced button without weakening origin, administrator, or preview checks",async()=>{
 const request=(origin="https://www.orbisy.com")=>new Request("https://www.orbisy.com/api/admin/followups/gmail/start",{method:"POST",headers:{origin,accept:"application/json"}});
 expect((await gmailStart(request())).status).toBe(401);
 mocks.identity.mockResolvedValue({email:"owner@example.test"});
 expect((await gmailStart(request("https://untrusted.example"))).status).toBe(409);
 vi.stubEnv("VERCEL_ENV","preview");expect((await gmailStart(request())).status).toBe(409);vi.stubEnv("VERCEL_ENV","production");
 const response=await gmailStart(request());expect(response.status).toBe(200);expect(response.headers.get("cache-control")).toBe("no-store");expect(response.headers.get("vary")).toBe("Accept");expect(response.headers.get("location")).toBeNull();
 const data=await response.json();const url=new URL(data.authorizationUrl);expect(url.origin).toBe("https://accounts.google.com");expect(url.pathname).toBe("/o/oauth2/v2/auth");expect(url.searchParams.get("state")).toBe(mocks.cookies.get("__Host-orbisy_gmail_oauth_state"));expect(url.searchParams.get("scope")).toBe("https://www.googleapis.com/auth/gmail.metadata");expect(url.searchParams.get("redirect_uri")).toBe("https://www.orbisy.com/api/admin/followups/gmail/callback");expect(JSON.stringify(data)).not.toMatch(/client_secret|encryption|refresh_token/);expect((await getFollowupSettings()).gmailTokenCiphertext).toBeNull();
 });
 it("synchronizes Gmail metadata without requesting message bodies and blocks incomplete history pages",async()=>{
 const {submission,conversation}=await enroll();await healthyGmail();let pages=0;
 const request=vi.fn(async(input:RequestInfo|URL)=>{const url=String(input);if(url==="https://oauth2.googleapis.com/token")return Response.json({access_token:"fictional-access"});if(url.endsWith("/profile"))return Response.json({emailAddress:"info@orbisy.com",historyId:"101"});if(url.includes("/history?")){pages++;return Response.json({historyId:"101",history:[{messagesAdded:[{message:{id:"gmail-sync-message"}}]}],...(pages<=3?{nextPageToken:`page-${pages}`}:{})});}if(url.includes("/messages/")){expect(url).toContain("format=metadata");expect(url).not.toContain("format=full");return Response.json({id:"gmail-sync-message",internalDate:String(Date.now()+1000),labelIds:["INBOX"],payload:{headers:[{name:"From",value:submission.email}]}});}throw Error("Unexpected external request");});vi.stubGlobal("fetch",request);
 expect(await syncGmail()).toBe(false);expect((await getFollowupSettings()).gmailPageToken).toBe("page-3");expect(await syncGmail()).toBe(true);expect((await getFollowupSettings()).gmailPageToken).toBeNull();expect((await mocks.db.select().from(schema.followupConversations).where(eq(schema.followupConversations.id,conversation.id)))[0].state).toBe("paused");
 });
 it("keeps tokens out of administrator view data and denies direct non-admin row reads",async()=>{await healthyGmail();const view=await getFollowupOverview();expect(JSON.stringify(view)).not.toMatch(/fictional-refresh-token|gmailTokenCiphertext|workerLease/);await pg.exec("create role qa_followup_anon;grant usage on schema public to qa_followup_anon;grant select on followup_settings,followup_conversations,followup_messages,followup_events to qa_followup_anon;set role qa_followup_anon;");try{for(const table of ["followup_settings","followup_conversations","followup_messages","followup_events"])expect((await pg.query(`select * from ${table}`)).rows).toHaveLength(0);}finally{await pg.exec("reset role");}});
});
