import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {AdminShell} from "@/components/admin/admin-shell";
import {MeasurementPlan} from "@/components/admin/measurement-plan";
import "../../admin-portal/admin.css";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Measurement setup preview",robots:{index:false,follow:false,nocache:true}};
export default function MeasurementPreview(){if(process.env.VERCEL_ENV!=="preview"&&process.env.NODE_ENV!=="development")notFound();return <AdminShell email="" reviewMode><p className="notice">Design preview · No database or Google account data is read. The link builder creates local examples and does not save anything.</p><header className="admin-heading"><div><h1>Measurement setup</h1></div></header><MeasurementPlan /></AdminShell>;}
