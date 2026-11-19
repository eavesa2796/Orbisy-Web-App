import { z } from "zod";
export const FOLLOWUP_MAILBOX = "info@orbisy.com";
export const followupKinds = ["acknowledgment","followup_one","followup_two","digest"] as const;
export const messageStates = ["draft","approved","sending","accepted","delivered","failed","uncertain","cancelled"] as const;
export const conversationStates = ["needs_response","waiting_reply","paused","closed"] as const;
export type Template = {subject:string;body:string};
export type Templates = Record<"acknowledgment"|"followup_one"|"followup_two",Template>;
export const defaultTemplates:Templates={
 acknowledgment:{subject:"Your Orbisy inquiry was received",body:"Hi {{first_name}},\n\nThanks for contacting Orbisy. An Orbisy developer will review your request and respond within a few business hours. Our response hours are 5 a.m.–9 p.m. Chicago time, seven days a week. Requests near closing or overnight will receive a personal response the next morning.\n\nThis confirms we received your inquiry; no project or appointment is booked yet.\n\nOrbisy\ninfo@orbisy.com"},
 followup_one:{subject:"Following up on your Orbisy project",body:"Hi {{first_name}},\n\nFollowing up on our conversation about your project. Would you like to arrange a time to discuss the next step? You can reply to this email whenever it is convenient.\n\nIf your plans have changed or you would prefer no more follow-ups, just reply and let us know.\n\nOrbisy\ninfo@orbisy.com"},
 followup_two:{subject:"A final check-in from Orbisy",body:"Hi {{first_name}},\n\nOne last check-in about your project. If you would like to continue the conversation, reply here and an Orbisy developer will help with the next step. Otherwise, we will pause these follow-ups.\n\nOrbisy\ninfo@orbisy.com"},
};
const templateSchema=z.object({subject:z.string().trim().min(1).max(180).refine(v=>!/[\r\n]/.test(v),"Use one subject line.").refine(v=>!v.replaceAll("{{first_name}}","").includes("{{"),"Only {{first_name}} is supported."),body:z.string().trim().min(20).max(6000).refine(v=>!v.replaceAll("{{first_name}}","").includes("{{"),"Only {{first_name}} is supported.")});
export const templatesSchema=z.object({acknowledgment:templateSchema,followup_one:templateSchema,followup_two:templateSchema});
export const messageEditSchema=templateSchema.extend({id:z.uuid()});
export function renderTemplate(template:Template,name:string){const first=name.trim().split(/\s+/)[0]?.replace(/[\r\n{}]/g,"").slice(0,60)||"there";return {subject:template.subject.replaceAll("{{first_name}}",first),body:template.body.replaceAll("{{first_name}}",first)};}
export function chicagoParts(date:Date){const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Chicago",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date);const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return {date:`${p.year}-${p.month}-${p.day}`,hour:Number(p.hour),minute:Number(p.minute)};}
export function withinSendingHours(date:Date){const {hour}=chicagoParts(date);return hour>=5&&hour<21;}
export function nextSendingTime(date:Date){let time=new Date(date);for(let i=0;i<2000&&!withinSendingHours(time);i++)time=new Date(time.getTime()+60000);return time;}
// All seven days are business days for this workflow. Preserve Chicago wall-clock time across DST.
export function afterBusinessDays(date:Date,days:number){const p=chicagoParts(date);const target=new Date(`${p.date}T12:00:00Z`);target.setUTCDate(target.getUTCDate()+days);const targetDate=target.toISOString().slice(0,10);let guess=new Date(date.getTime()+days*86400000);for(let i=0;i<4;i++){const g=chicagoParts(guess);const desired=Date.parse(`${targetDate}T${String(p.hour).padStart(2,"0")}:${String(p.minute).padStart(2,"0")}:00Z`);const actual=Date.parse(`${g.date}T${String(g.hour).padStart(2,"0")}:${String(g.minute).padStart(2,"0")}:00Z`);guess=new Date(guess.getTime()+desired-actual);}return nextSendingTime(guess);}
export function outboundEnabled(){return process.env.VERCEL_ENV==="production"&&process.env.FOLLOWUP_SEND_ENABLED==="true";}
