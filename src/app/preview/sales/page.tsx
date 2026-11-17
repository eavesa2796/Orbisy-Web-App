import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { SalesOverview } from "@/components/admin/sales-overview";
import { salesRange, type SalesSummary } from "@/lib/sales-reporting";
import "../../admin-portal/admin.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sales overview design preview", robots: { index: false, follow: false, nocache: true } };
export default async function SalesPreview({ searchParams }: {
    searchParams: Promise<{
        days?: string;
    }>;
}) {
    if (process.env.VERCEL_ENV !== "preview" && process.env.NODE_ENV !== "development")
        notFound();
    const days = salesRange((await searchParams).days);
    const data: SalesSummary = { days, totals: { inquiries: 6, progressing: 4, proposalPending: 1, won: 1, lost: 1 }, statuses: [{ status: "new_inbound", count: 1 }, { status: "qualified", count: 1 }, { status: "consultation", count: 1 }, { status: "proposal_sent", count: 1 }, { status: "won", count: 1 }, { status: "lost", count: 1 }], services: [{ service: "Association websites", count: 3 }, { service: "Member portals & custom functionality", count: 2 }, { service: "Integrations & connected systems", count: 1 }], sources: [{ source: "newsletter", medium: "email", campaign: "website-planning", count: 3, won: 1 }, { source: "Not captured", medium: "Not captured", campaign: "Not captured", count: 2, won: 0 }, { source: "example.org", medium: "Not captured", campaign: "Not captured", count: 1, won: 0 }], recent: [{ id: "example-inquiry", leadId: "example-lead", name: "Example Membership Association", service: "Association websites", status: "consultation", submittedAt: new Date("2026-11-17T14:00:00Z") }], followUps: [{ id: "example-lead", name: "Example Event Association", status: "proposal_sent", followUpAt: new Date("2026-11-16T16:00:00Z") }], followUpsDue: 1, workspaceProposals: 1 };
    return <AdminShell email="" reviewMode><p className="notice"><strong>Design preview · Fictional example data.</strong> No real inquiries, reports, or database records are read. The figures below demonstrate the layout and do not represent Orbisy’s performance. Date-range links update the period label only.</p><header className="admin-heading"><div><p className="eyebrow">Business reporting</p><h1>Sales overview</h1><p>Saved inquiries, requested services, sources, and current outcomes.</p></div><nav className="range-tabs" aria-label="Example inquiry date range">{[7, 30, 90, 0].map(range => <Link href={`?days=${range}`} key={range} className={days === range ? "active" : ""}>{range ? `${range} days` : "All time"}</Link>)}</nav></header><SalesOverview data={data} reviewMode/></AdminShell>;
}
