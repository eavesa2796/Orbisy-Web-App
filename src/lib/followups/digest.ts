import "server-only";
import {and,asc,eq,gt,inArray,isNotNull,isNull,notExists,notInArray,or,sql} from "drizzle-orm";
import type {getDb} from "@/lib/db";
import {followupConversations,followupMessages,leads,suppressionEntries} from "@/lib/db/schema";
import {chicagoParts} from "./model";

type DigestDb = Pick<ReturnType<typeof getDb>, "select">;
type DigestItem = {leadId:string;businessName:string};
const activeLeadStatuses = ["new_inbound","qualified","contact_planned","contacted"] as const;

export function dailyDigestKey(now:Date) {
 return `digest:${chicagoParts(now).date}`;
}

export function digestWindowOpen(now:Date,hour:number) {
 const local = chicagoParts(now);
 return local.hour >= hour && local.hour < 21;
}

export async function loadDigestSnapshot(db:DigestDb,now:Date) {
 const unsuppressed = notExists(db.select({id:suppressionEntries.id}).from(suppressionEntries).where(and(
  or(eq(suppressionEntries.normalizedEmail,followupConversations.recipientEmail),
   eq(suppressionEntries.normalizedDomain,sql`split_part(${followupConversations.recipientEmail},'@',2)`),
   eq(suppressionEntries.leadId,followupConversations.leadId)),
  or(isNull(suppressionEntries.expiresAt),gt(suppressionEntries.expiresAt,now)),
 )));
 const fields = {leadId:leads.id,businessName:leads.businessName,total:sql<number>`count(*) over()::int`};
 const [unanswered,replies,drafts] = await Promise.all([
  db.select(fields).from(followupConversations).innerJoin(leads,eq(followupConversations.leadId,leads.id))
   .where(and(eq(followupConversations.state,"needs_response"),isNull(followupConversations.personalResponseAt),isNull(followupConversations.replyAt),inArray(leads.status,activeLeadStatuses),unsuppressed))
   .orderBy(asc(followupConversations.createdAt),asc(leads.id)).limit(5),
  db.select(fields).from(followupConversations).innerJoin(leads,eq(followupConversations.leadId,leads.id))
   .where(and(eq(followupConversations.state,"paused"),isNotNull(followupConversations.replyAt),notInArray(leads.status,["won","lost","suppressed"]),unsuppressed))
   .orderBy(asc(followupConversations.replyAt),asc(leads.id)).limit(5),
  db.select({...fields,kind:followupMessages.kind}).from(followupMessages)
   .innerJoin(followupConversations,eq(followupMessages.conversationId,followupConversations.id))
   .innerJoin(leads,eq(followupConversations.leadId,leads.id))
   .where(and(eq(followupMessages.status,"draft"),isNull(followupMessages.firstAttemptAt),isNull(followupConversations.replyAt),
    inArray(followupConversations.state,["needs_response","waiting_reply"]),inArray(leads.status,activeLeadStatuses),unsuppressed,
    or(and(eq(followupMessages.kind,"acknowledgment"),isNull(followupConversations.personalResponseAt)),
     and(inArray(followupMessages.kind,["followup_one","followup_two"]),eq(followupConversations.state,"waiting_reply"),isNotNull(followupConversations.personalResponseAt)))))
   .orderBy(asc(followupMessages.dueAt),asc(followupMessages.id)).limit(5),
 ]);
 const counts = {unanswered:unanswered[0]?.total ?? 0,replies:replies[0]?.total ?? 0,drafts:drafts[0]?.total ?? 0};
 return {counts,unanswered,replies,drafts,hasActions:counts.unanswered+counts.replies+counts.drafts>0};
}

export type DigestSnapshot = Awaited<ReturnType<typeof loadDigestSnapshot>>;

export function renderDailyDigest(snapshot:DigestSnapshot,now:Date) {
 const section = (title:string,count:number,items:DigestItem[]) => [
  `${title}: ${count}`,
  ...items.flatMap(item=>[
   `- ${item.businessName.replace(/\s+/g," ").trim().slice(0,160) || "Saved inquiry"}${"kind" in item ? ` (${draftLabel(String(item.kind))})` : ""}`,
   `  https://www.orbisy.com/admin-portal/leads/${item.leadId}`,
  ]),
  ...(count>items.length?[`Plus ${count-items.length} more in the follow-up inbox.`]:[]),
 ].join("\n");
 return [
  `Orbisy follow-up summary · ${chicagoParts(now).date} (Chicago time)`,
  section("Inquiries needing your personal response",snapshot.counts.unanswered,snapshot.unanswered),
  section("Replies paused for your review",snapshot.counts.replies,snapshot.replies),
  section("Email drafts awaiting approval",snapshot.counts.drafts,snapshot.drafts),
  "Future reminder drafts are included when they are ready for your review. Sending still follows each draft's scheduled time and requires individual approval.",
  "Open your follow-up inbox:\nhttps://www.orbisy.com/admin-portal/followups\nAdministrator sign-in is required.",
 ].join("\n\n");
}

function draftLabel(kind:string) {
 return ({acknowledgment:"acknowledgment",followup_one:"first reminder",followup_two:"final reminder"} as Record<string,string>)[kind] || "email draft";
}
