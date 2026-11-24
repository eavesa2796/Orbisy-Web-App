import "server-only";
import {createHmac} from "node:crypto";
import {secureEqual} from "@/lib/followups/security";
export function outreachStopUrl(id:string,now=Date.now()){
 const key=process.env.FOLLOWUP_UNSUBSCRIBE_SECRET||"";if(key.length<32)throw Error("Preference signing is not configured.");
 const data=Buffer.from(JSON.stringify({id,expires:now+90*86400000})).toString("base64url");
 const signature=createHmac("sha256",key).update(`outreach:${data}`).digest("base64url");
 return `https://www.orbisy.com/api/outreach/unsubscribe?token=${data}.${signature}`;
}
export function verifyOutreachStop(token:string,now=Date.now()){try{
 const key=process.env.FOLLOWUP_UNSUBSCRIBE_SECRET||"";if(key.length<32||token.length>500||!(/^[\w-]+\.[\w-]+$/).test(token))return undefined;
 const [data,signature]=token.split(".");if(!secureEqual(createHmac("sha256",key).update(`outreach:${data}`).digest("base64url"),signature))return undefined;
 const value=JSON.parse(Buffer.from(data,"base64url").toString());return typeof value.id==="string"&&/^[a-f0-9-]{36}$/.test(value.id)&&Number.isFinite(value.expires)&&value.expires>=now&&value.expires<=now+91*86400000?value.id as string:undefined;
 }catch{return undefined;}}
