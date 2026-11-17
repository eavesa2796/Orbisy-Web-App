import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { KnowledgeEditor } from "@/components/admin/knowledge-editor";
import { knowledgeStarters } from "@/lib/knowledge-base-starters";
import type { knowledgeArticles } from "@/lib/db/schema";
import "../../admin-portal/admin.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Knowledge manager design review", robots: { index: false, follow: false, nocache: true } };
export default function KnowledgeReview() { if (process.env.VERCEL_ENV !== "preview" && process.env.NODE_ENV !== "development")
    notFound(); const article = knowledgeStarters[0]; const entry: typeof knowledgeArticles.$inferSelect = { ...article, id: "00000000-0000-4000-8000-000000000001", status: "draft", published: null, internalNotes: "Example editorial reminder: confirm this content before publishing.", reviewedOn: null, version: 1, updatedBy: "Preview only", createdAt: new Date("2026-11-17T00:00:00Z"), updatedAt: new Date("2026-11-17T00:00:00Z") }; return <AdminShell email="Preview only" reviewMode><header className="admin-heading"><div><p className="eyebrow">Read-only review</p><h1>Knowledge article manager</h1><p>Proposed starter content. No database access, private records, saves, or publication.</p></div><Link href="/knowledge-base" className="button button-secondary">Browse guide preview</Link></header><section className="admin-card"><h2>Write → review → publish</h2><p className="muted">In the real authenticated manager, Save draft changes leaves the live version unchanged. Publish updates it; Unpublish and Archive hide it. The controls below are disabled for this design review.</p></section><section className="admin-card"><KnowledgeEditor entry={entry} reviewMode/></section></AdminShell>; }
