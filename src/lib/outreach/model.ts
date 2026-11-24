import {z} from "zod";
import {chicagoParts, afterBusinessDays} from "@/lib/followups/model";

export const outreachDefaults = {
 name:"Association website conversations",
 subject:"A website question for {{organization}}",
 bodies:[
  "Hi {{first_name}},\n\nI'm reaching out from Orbisy about {{organization}}. Orbisy builds association websites and custom functionality around member needs and staff workflows.\n\nIs there a website task or manual process your team would like to improve? If so, would a short conversation be useful?\n\nOrbisy developer\ninfo@orbisy.com",
  "Hi {{first_name}},\n\nFollowing up on my note about {{organization}}. Is a website or staff workflow improvement on your team's agenda, or is there someone else I should speak with?\n\nIf useful, we can start with one clearly scoped improvement.\n\nOrbisy developer\ninfo@orbisy.com",
  "Hi {{first_name}},\n\nOne final note about {{organization}}. If a website or workflow project becomes a priority, you can reply here to discuss it with Orbisy.\n\nI'll leave it with you and won't continue this outreach sequence.\n\nOrbisy developer\ninfo@orbisy.com",
 ],
};
const placeholdersValid=(v:string)=>!v.replaceAll("{{first_name}}","").replaceAll("{{organization}}","").includes("{{");
export const bodySchema=z.string().trim().min(30).max(6000).refine(placeholdersValid,"Use only {{first_name}} and {{organization}}.");
export const subjectSchema=z.string().trim().min(3).max(160).refine(v=>!/[\r\n]/.test(v)&&!/^\s*(re|fw|fwd)\s*:/i.test(v),"Use an honest new subject without Re: or Fwd:.").refine(placeholdersValid,"Unsupported placeholder.");
export const campaignSchema=z.object({name:z.string().trim().min(3).max(120),subject:subjectSchema,body0:bodySchema,body1:bodySchema,body2:bodySchema});
export const prospectSchema=z.object({campaignId:z.uuid(),leadId:z.union([z.uuid(),z.literal("")]).optional(),businessName:z.string().trim().min(2).max(160),recipientName:z.string().trim().min(1).max(100),recipientEmail:z.email().max(254).transform(v=>v.toLowerCase()).refine(v=>v!=="info@orbisy.com","Choose the recipient’s business email, not the sending mailbox."),sourceUrl:z.url().max(2000).refine(v=>["https:","http:"].includes(new URL(v).protocol),"Use a public business source URL."),contactBasis:z.enum(["permission","prior_relationship","business_introduction"]),contactReason:z.string().trim().min(20).max(2000)});
export function renderOutreach(value:string,name:string,organization:string){return value.replaceAll("{{first_name}}",name.trim().split(/\s+/)[0].replace(/[\r\n{}]/g,"")).replaceAll("{{organization}}",organization.replace(/[\r\n{}]/g," "));}
export function isOutreachTime(date:Date){const {hour}=chicagoParts(date);const weekday=new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",weekday:"short"}).format(date);return !["Sat","Sun"].includes(weekday)&&hour>=9&&hour<17;}
export function nextOutreachTime(date:Date){let next=new Date(date);for(let i=0;i<4500&&!isOutreachTime(next);i++)next=new Date(next.getTime()+60000);return next;}
export function afterOutreachDays(date:Date,days:number){let next=date;for(let added=0;added<days;){next=afterBusinessDays(next,1);const weekday=new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",weekday:"short"}).format(next);if(!["Sat","Sun"].includes(weekday))added++;}return nextOutreachTime(next);}
export function outreachEnabled(){return process.env.VERCEL_ENV==="production"&&process.env.OUTREACH_SEND_ENABLED==="true";}
