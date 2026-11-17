import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AdminShell } from "@/components/admin/admin-shell";
import { KnowledgeEditor } from "@/components/admin/knowledge-editor";
import { KnowledgeBody } from "@/components/knowledge-body";
import "@/components/knowledge-base.css";
import { requireAdmin } from "@/lib/auth";
import { getKnowledgeEntry } from "@/lib/data/knowledge-base";
export const dynamic = "force-dynamic";
export default async function EditKnowledgeArticle({ params }: {
    params: Promise<{
        id: string;
    }>;
}) { const admin = await requireAdmin(); const { id } = await params; if (!z.uuid().safeParse(id).success)
    notFound(); const entry = await getKnowledgeEntry(id); if (!entry)
    notFound(); return <AdminShell email={admin.email}><Link className="text-link" href="/admin-portal/knowledge-base">← All articles</Link><header className="admin-heading"><div><p className="eyebrow">{entry.status} · version {entry.version}</p><h1>{entry.title}</h1><p>Draft changes stay private until you explicitly publish this version.</p></div>{entry.status === "published" && <Link href={`/knowledge-base/${entry.slug}`} className="button button-secondary">View public article</Link>}</header><section className="admin-card"><KnowledgeEditor entry={entry} key={entry.version}/></section>{entry.published && <details className="admin-card"><summary>Last published snapshot · revision {entry.published.revision}{entry.status !== "published" ? " · currently hidden" : ""}</summary><h2>{entry.published.title}</h2><p>{entry.published.summary}</p><KnowledgeBody body={entry.published.body}/></details>}</AdminShell>; }
