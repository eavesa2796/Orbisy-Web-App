import "server-only";
import {createHmac,timingSafeEqual} from "node:crypto";
export function secureEqual(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
function webhookKey(){const value=process.env.FOLLOWUP_RESEND_WEBHOOK_SECRET||"";if(!value.startsWith("whsec_")||!(/^[A-Za-z0-9+/]+={0,2}$/).test(value.slice(6)))return undefined;const key=Buffer.from(value.slice(6),"base64");return key.length>=16?key:undefined;}
export function resendWebhookConfigured(){return !!webhookKey();}
export function verifyResendWebhook(body:string,headers:Headers,now=Date.now()){
 const key=webhookKey();const id=headers.get("svix-id"),stamp=headers.get("svix-timestamp"),signature=headers.get("svix-signature");
 if(!key||!id||!stamp||!signature||!/^\d+$/.test(stamp)||Math.abs(now/1000-Number(stamp))>300)return undefined;
 const expected=createHmac("sha256",key).update(`${id}.${stamp}.${body}`).digest("base64");
 return signature.split(" ").some(value=>{const [version,sig]=value.split(",");return version==="v1"&&!!sig&&secureEqual(expected,sig);})?id:undefined;
}
function signingSecret(){const secret=process.env.FOLLOWUP_UNSUBSCRIBE_SECRET||"";if(secret.length<32)throw Error("FOLLOWUP_PREFERENCES_NOT_CONFIGURED");return secret;}
export function unsubscribeUrl(id:string,now=Date.now()){const payload=Buffer.from(JSON.stringify({id,expires:now+90*86400000})).toString("base64url");const sig=createHmac("sha256",signingSecret()).update(payload).digest("base64url");return `https://www.orbisy.com/api/followups/unsubscribe?token=${payload}.${sig}`;}
export function verifyUnsubscribeToken(token:string,now=Date.now()){try{if(token.length>500||!(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/).test(token))return undefined;const [payload,sig,extra]=token.split(".");if(!payload||!sig||extra)return undefined;const expected=createHmac("sha256",signingSecret()).update(payload).digest("base64url");if(!secureEqual(expected,sig))return undefined;const data=JSON.parse(Buffer.from(payload,"base64url").toString());if(!/^[a-f0-9-]{36}$/.test(data.id)||!Number.isFinite(data.expires)||data.expires<now||data.expires>now+91*86400000)return undefined;return data.id as string;}catch{return undefined;}}
export function mailingConfigurationReady(){return (process.env.FOLLOWUP_POSTAL_ADDRESS?.trim().length||0)>=10&&(process.env.FOLLOWUP_UNSUBSCRIBE_SECRET?.length||0)>=32;}

export async function boundedRequestText(request:Request,maxBytes:number){if(Number(request.headers.get("content-length")||0)>maxBytes)throw Error("BODY_TOO_LARGE");if(!request.body)return "";const reader=request.body.getReader();const chunks:Uint8Array[]=[];let size=0;try{for(;;){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>maxBytes){await reader.cancel();throw Error("BODY_TOO_LARGE");}chunks.push(next.value);}}finally{reader.releaseLock();}return Buffer.concat(chunks).toString("utf8");}
