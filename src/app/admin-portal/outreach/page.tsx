import {AdminShell} from "@/components/admin/admin-shell";
import {OutreachWorkspace} from "@/components/admin/outreach-workspace";
import {requireAdmin} from "@/lib/auth";
import {getOutreachOverview} from "@/lib/data/outreach";
import "@/components/admin/outreach-workspace.css";
export const dynamic="force-dynamic";
export default async function OutreachPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const admin=await requireAdmin(),params=await searchParams;let data:Awaited<ReturnType<typeof getOutreachOverview>>|null=null;try{data=await getOutreachOverview();}catch{}
 return <AdminShell email={admin.email}><header className="admin-heading"><div><p className="eyebrow">Association business development</p><h1>Outreach</h1><p>Review a relevant business introduction, approve its follow-ups, and keep every conversation under your control.</p></div></header>{data?<OutreachWorkspace data={data} notice={typeof params.notice==="string"?params.notice:undefined}/>:<section className="admin-card"><h2>Outreach setup needed</h2><p>Apply the reviewed outreach migration to the intended database before using this page. Existing leads and inbound follow-ups remain available.</p></section>}</AdminShell>;
}
