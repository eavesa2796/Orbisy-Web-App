import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { cache } from "react";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { knowledgeArticles } from "@/lib/db/schema";
import { publicArticleSchema, type PublicArticle } from "@/lib/knowledge-base";
import { previewKnowledgeArticles } from "@/lib/knowledge-base-starters";
export const knowledgePreview = process.env.VERCEL_ENV === "preview";
// Never selects draft content, internal notes, editor identity, or private client data.
export const getPublicKnowledge = cache(async (): Promise<PublicArticle[]> => {
    if (knowledgePreview)
        return previewKnowledgeArticles();
    const rows = await getDb().select({ published: knowledgeArticles.published }).from(knowledgeArticles).where(eq(knowledgeArticles.status, "published")).orderBy(asc(knowledgeArticles.slug));
    return rows.flatMap(row => { const result = publicArticleSchema.safeParse(row.published); return result.success ? [result.data] : []; });
});
export async function getKnowledgeEntries() {
    await requireAdmin();
    return getDb().select().from(knowledgeArticles).orderBy(desc(knowledgeArticles.updatedAt));
}
export async function getKnowledgeEntry(id: string) {
    await requireAdmin();
    return (await getDb().select().from(knowledgeArticles).where(eq(knowledgeArticles.id, id)).limit(1))[0];
}
