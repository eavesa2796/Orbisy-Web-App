import {runOutreachWorker} from "@/lib/outreach/worker";
import {secureEqual} from "@/lib/followups/security";
import {runFollowupWorker} from "@/lib/followups/worker";
export const runtime="nodejs";
export const maxDuration=60;
export async function POST(request:Request){const secret=process.env.FOLLOWUP_CRON_SECRET;if(!secret||secret.length<32||!secureEqual(request.headers.get("authorization")||"",`Bearer ${secret}`))return Response.json({error:"Unauthorized"},{status:401});const result=await runFollowupWorker();const outreach=await runOutreachWorker().catch(()=>({status:"needs_attention",sent:0}));return Response.json({...result,outreach},{status:result.status==="needs_attention"||outreach.status==="needs_attention"?503:200,headers:{"Cache-Control":"no-store"}});}
