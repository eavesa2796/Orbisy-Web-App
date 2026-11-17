import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { AddKnowledgeStarters } from "@/components/admin/knowledge-editor";
import { requireAdmin } from "@/lib/auth";
import { getKnowledgeEntries } from "@/lib/data/knowledge-base";
import { knowledgeCategories } from "@/lib/knowledge-base";
export const dynamic = "force-dynamic";
export default async function KnowledgeManager({ searchParams }: {
    searchParams: Promise<{
        status?: string;
    }>;
}) {
    const admin = await requireAdmin();
    const { status } = await searchParams;
    let entries: Awaited<ReturnType<typeof getKnowledgeEntries>> | null = null;
    try {
        entries = await getKnowledgeEntries();
    }
    catch { }
    const shown = entries?.filter(e => !status || e.status === status);
    return <AdminShell email={admin.email}><header className="admin-heading"><div><p className="eyebrow">Website content</p><h1>Knowledge base</h1><p>Write helpful answers. Review them. Publish only what visitors should see.</p></div><Link className="button" href="/admin-portal/knowledge-base/new">New article</Link></header>
 <details className="admin-card" open><summary><strong>How to use this tool</strong></summary><ol className="kb-admin-instructions"><li><strong>Start a draft.</strong> Create an article or add the proposed starter drafts below. Drafts are private.</li><li><strong>Write and review.</strong> Choose a topic, add a summary, and check the content preview. Keep client details and confidential material out of article content.</li><li><strong>Publish deliberately.</strong> Enter the date you checked the content and choose Publish. Saving changes alone does not replace an existing live version.</li><li><strong>Keep it current.</strong> Review old articles. Unpublish temporarily or archive an article to hide it while retaining its record.</li></ol><p className="muted">This is the future chatbot’s potential source library. No chatbot, embeddings, or automated answers are enabled. Internal notes and business records are excluded from the public content projection.</p></details>
 {entries === null ? <section className="admin-card"><h2>Database setup needed</h2><p>Apply the reviewed 0010_knowledge_base migration to the intended database before managing articles. No content has been saved or published by opening this page.</p></section> : <><section className="admin-card"><div className="card-heading"><div><h2>Start with useful questions</h2><p className="muted">Six proposed articles. Adding them never publishes them or overwrites matching slugs.</p></div><AddKnowledgeStarters /></div></section><section className="admin-card"><form className="filter-row"><label>Status<select name="status" defaultValue={status ?? ""}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><button className="button button-secondary">Filter articles</button></form><h2>Articles ({shown?.length ?? 0})</h2><ul className="admin-list">{shown?.map(entry => <li key={entry.id}><div><Link href={`/admin-portal/knowledge-base/${entry.id}`}>{entry.title}</Link><span>{knowledgeCategories[entry.category as keyof typeof knowledgeCategories]} · {entry.status} · {entry.reviewedOn ? `Reviewed ${entry.reviewedOn}` : "Needs a review date"}</span>{entry.published && (entry.body !== entry.published.body || entry.title !== entry.published.title || entry.summary !== entry.published.summary || entry.category !== entry.published.category || entry.reviewedOn !== entry.published.reviewedOn) && <span>Unpublished edits saved</span>}</div><Link href={`/admin-portal/knowledge-base/${entry.id}`}>Edit →</Link></li>)}</ul>{!shown?.length && <p className="muted">No matching articles. Start a draft or add the starter questions.</p>}</section></>}
 <Link href="/knowledge-base" className="text-link">View the public knowledge base →</Link></AdminShell>;
}
