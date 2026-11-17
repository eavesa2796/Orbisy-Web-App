import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { KnowledgeEditor } from "@/components/admin/knowledge-editor";
import { requireAdmin } from "@/lib/auth";
export default async function NewKnowledgeArticle() { const admin = await requireAdmin(); return <AdminShell email={admin.email}><Link href="/admin-portal/knowledge-base" className="text-link">← All articles</Link><header className="admin-heading"><div><p className="eyebrow">New draft</p><h1>Write a useful answer</h1><p>Nothing becomes public until you choose Publish this version.</p></div></header><section className="admin-card"><KnowledgeEditor /></section></AdminShell>; }
