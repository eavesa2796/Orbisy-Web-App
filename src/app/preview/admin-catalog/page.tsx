import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { LeadReceivedTime } from "@/components/admin/lead-received-time";
import { PricingReference } from "@/components/admin/pricing-reference";
import "../../admin-portal/admin.css";
import "@/components/admin/sales-overview.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {title:"Admin pricing & timestamp review",robots:{index:false,follow:false,nocache:true}};
export default function AdminCatalogPreview() {
 if(process.env.VERCEL_ENV !== "preview" && process.env.NODE_ENV !== "development") notFound();
 return <AdminShell email="" reviewMode><p className="notice"><strong>Read-only design preview.</strong> Lead names and dates below are fictional. No database is read and no pricing is saved. The proposed price ranges are awaiting owner review.</p>
 <header className="admin-heading"><div><p className="eyebrow">Admin improvements</p><h1>Inquiry times & association pricing</h1></div></header>
 <section className="admin-card"><h2>Received / added · Chicago time</h2><p>Website inquiries use the original submission time. Manual or imported leads use the time the record was added. Editing a record does not change these dates.</p><div className="table-wrap"><table><thead><tr><th>Example record</th><th>Received / added</th></tr></thead><tbody><tr><td>Example Association · website inquiry</td><td><LeadReceivedTime submissionId="example" inquiryReceivedAt={new Date("2026-11-18T01:05:00Z")} createdAt={new Date("2026-11-18T01:05:01Z")} /></td></tr><tr><td>Example Society · manually added lead</td><td><LeadReceivedTime submissionId={null} inquiryReceivedAt={null} createdAt={new Date("2026-11-17T17:42:00Z")} /></td></tr></tbody></table></div></section>
 <PricingReference /></AdminShell>;
}
