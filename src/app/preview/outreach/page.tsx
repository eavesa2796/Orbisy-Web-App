import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {AdminShell} from "@/components/admin/admin-shell";
import {OutreachWorkspace} from "@/components/admin/outreach-workspace";
import {outreachExample} from "@/lib/outreach/example";
import "../../admin-portal/admin.css";
import "@/components/admin/outreach-workspace.css";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Outreach design preview",robots:{index:false,follow:false,nocache:true}};
export default function OutreachPreview(){if(process.env.VERCEL_ENV!=="preview"&&process.env.NODE_ENV!=="development")notFound();return <AdminShell email="" reviewMode><header className="admin-heading"><div><p className="eyebrow">Association business development</p><h1>Outreach</h1><p>A fictional review of the new outreach workspace.</p></div></header><OutreachWorkspace data={outreachExample()} reviewMode/></AdminShell>;}
