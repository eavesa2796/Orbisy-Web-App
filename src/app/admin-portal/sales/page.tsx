import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { SalesOverview } from "@/components/admin/sales-overview";
import { ToolGuide } from "@/components/admin/tool-guide";
import { requireAdmin } from "@/lib/auth";
import { getSalesSummary } from "@/lib/data/sales";
import { salesRange } from "@/lib/sales-reporting";
export const dynamic = "force-dynamic";
export default async function SalesPage({ searchParams }: {
    searchParams: Promise<{
        days?: string;
    }>;
}) {
    const admin = await requireAdmin();
    const days = salesRange((await searchParams).days);
    let data: Awaited<ReturnType<typeof getSalesSummary>> | null = null;
    try {
        data = await getSalesSummary(days);
    }
    catch { }
    return <AdminShell email={admin.email}><header className="admin-heading"><div><p className="eyebrow">Business reporting</p><h1>Sales overview</h1><p>Saved inquiries, requested services, sources, and current outcomes.</p></div><nav className="range-tabs" aria-label="Inquiry date range">{[7, 30, 90, 0].map(range => <Link href={`?days=${range}`} aria-current={days === range ? "page" : undefined} className={days === range ? "active" : ""} key={range}>{range ? `${range} days` : "All time"}</Link>)}</nav></header><ToolGuide tool="analytics"/>{data ? <SalesOverview data={data}/> : <section className="admin-card"><h2>Sales records are temporarily unavailable</h2><p>No totals are shown because the database could not be queried. Saved inquiries and historical analytics have not been deleted.</p><Link href="/admin-portal/leads">Open inquiries & leads →</Link></section>}</AdminShell>;
}
