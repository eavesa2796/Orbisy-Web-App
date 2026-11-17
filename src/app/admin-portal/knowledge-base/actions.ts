"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { adminActivityLogs, knowledgeArticles } from "@/lib/db/schema";
import { articleDraftSchema, publishedArticle } from "@/lib/knowledge-base";
import { knowledgeStarters } from "@/lib/knowledge-base-starters";
export type KnowledgeActionState = {
    success: boolean;
    message: string;
    id?: string;
    version?: number;
};
export async function saveKnowledgeAction(_previous: KnowledgeActionState, form: FormData): Promise<KnowledgeActionState> {
    void _previous;
    const admin = await requireAdmin();
    const parsed = articleDraftSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success)
        return { success: false, message: parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(" ") };
    const p = parsed.data;
    let saved: {
        id: string;
        version: number;
    };
    try {
        saved = await getDb().transaction(async (tx) => {
            const existing = p.id ? (await tx.select().from(knowledgeArticles).where(eq(knowledgeArticles.id, p.id)).limit(1))[0] : undefined;
            if (p.id && !existing)
                throw new Error("NOT_FOUND");
            if (existing && existing.version !== p.version)
                throw new Error("CONFLICT");
            if (existing?.published && existing.slug !== p.slug)
                throw new Error("SLUG_LOCKED");
            const snapshot = p.intent === "publish" ? publishedArticle(p, (existing?.published?.revision ?? 0) + 1) : existing?.published ?? null;
            const status = p.intent === "publish" ? "published" : p.intent === "unpublish" ? "draft" : p.intent === "archive" ? "archived" : existing?.status ?? "draft";
            const values = { slug: p.slug, title: p.title, category: p.category, summary: p.summary, body: p.body, internalNotes: p.internalNotes, reviewedOn: p.reviewedOn || null, status, published: snapshot, version: (existing?.version ?? 0) + 1, updatedBy: admin.email, updatedAt: new Date() };
            const [entry] = existing ? await tx.update(knowledgeArticles).set(values).where(and(eq(knowledgeArticles.id, existing.id), eq(knowledgeArticles.version, p.version))).returning({ id: knowledgeArticles.id, version: knowledgeArticles.version }) : await tx.insert(knowledgeArticles).values(values).returning({ id: knowledgeArticles.id, version: knowledgeArticles.version });
            if (!entry)
                throw new Error("CONFLICT");
            await tx.insert(adminActivityLogs).values({ adminEmail: admin.email, action: `knowledge_${p.intent}`, entityType: "knowledge_article", entityId: entry.id, metadata: { status, version: entry.version } });
            return entry;
        });
    }
    catch (error) {
        const code = error instanceof Error ? error.message : "";
        return { success: false, message: code === "CONFLICT" ? "A newer edit was saved. Reload this page before trying again; copy your unsaved text first." : code === "SLUG_LOCKED" ? "The address is locked after first publication to protect existing links." : code === "REVIEW_DATE_REQUIRED" ? "Publishing needs a review date of today or earlier." : code === "NOT_FOUND" ? "This article no longer exists. Reload the article list." : "Not saved. Check that the slug is unique, the migration is applied, and publishing has a summary of at least 30 characters and content of at least 150 characters." };
    }
    revalidatePath("/admin-portal/knowledge-base", "layout");
    revalidatePath("/knowledge-base", "layout");
    revalidatePath("/sitemap.xml");
    return { success: true, message: p.intent === "publish" ? "Published. Visitors now see this version." : p.intent === "unpublish" ? "Unpublished. The article is now private." : p.intent === "archive" ? "Archived. The article is hidden from visitors; its content is retained." : "Draft saved. Any previously published version is unchanged.", ...saved };
}
export async function addKnowledgeStartersAction(_previous: KnowledgeActionState): Promise<KnowledgeActionState> {
    void _previous;
    const admin = await requireAdmin();
    try {
        await getDb().transaction(async (tx) => {
            for (const article of knowledgeStarters)
                await tx.insert(knowledgeArticles).values({ ...article, status: "draft", updatedBy: admin.email }).onConflictDoNothing({ target: knowledgeArticles.slug });
            await tx.insert(adminActivityLogs).values({ adminEmail: admin.email, action: "knowledge_starters_added", entityType: "knowledge_catalog", metadata: { published: false } });
        });
    }
    catch {
        return { success: false, message: "Starter drafts could not be added. Check the database connection and knowledge-base migration." };
    }
    revalidatePath("/admin-portal/knowledge-base");
    return { success: true, message: "Starter drafts added. Existing entries were kept. Review each article and publish when ready." };
}
