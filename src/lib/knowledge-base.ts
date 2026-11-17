import { z } from "zod";
export const knowledgeCategories = {
    websites: "Association websites",
    members: "Member experience",
    integrations: "Connected systems",
    process: "Projects & support",
} as const;
export const articleStatuses = ["draft", "published", "archived"] as const;
const category = z.enum(["websites", "members", "integrations", "process"]);
export const articleSlug = z.string().trim().min(3).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens.");
const reviewDate = z.string().refine(value => value === "" || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value), "Use a valid review date.");
export const articleDraftSchema = z.object({
    id: z.union([z.literal(""), z.uuid()]),
    version: z.coerce.number().int().min(0),
    intent: z.enum(["save_draft", "publish", "unpublish", "archive"]),
    title: z.string().trim().min(3).max(160),
    slug: articleSlug,
    category,
    summary: z.string().trim().max(350),
    body: z.string().trim().max(40000),
    internalNotes: z.string().trim().max(5000),
    reviewedOn: reviewDate,
});
export const publicArticleSchema = z.object({
    title: z.string().min(3).max(160), slug: articleSlug, category,
    summary: z.string().min(30).max(350), body: z.string().min(150).max(40000),
    reviewedOn: z.string().min(10).pipe(reviewDate),
    publishedAt: z.iso.datetime(), revision: z.number().int().positive(),
}).strict();
export type PublicArticle = z.infer<typeof publicArticleSchema>;
export type ArticleDraft = z.infer<typeof articleDraftSchema>;
export function publishedArticle(draft: ArticleDraft, revision: number, now = new Date()): PublicArticle {
    if (!draft.reviewedOn || draft.reviewedOn > now.toISOString().slice(0, 10))
        throw new Error("REVIEW_DATE_REQUIRED");
    return publicArticleSchema.parse({ title: draft.title, slug: draft.slug, category: draft.category, summary: draft.summary, body: draft.body, reviewedOn: draft.reviewedOn, publishedAt: now.toISOString(), revision });
}
export function filterKnowledge(articles: PublicArticle[], query = "", topic = "") {
    const words = query.normalize("NFKC").toLowerCase().trim().slice(0, 120).split(/\s+/).filter(Boolean).slice(0, 12);
    return articles.filter(article => (!topic || article.category === topic) && words.every(word => `${article.title} ${article.summary} ${article.body}`.normalize("NFKC").toLowerCase().includes(word)));
}
export function knowledgeTextBlocks(body: string) {
    return body.replace(/\r\n/g, "\n").split(/\n\s*\n/).filter(Boolean).map((text, index) => ({ id: `section-${index + 1}`, text: text.trim(), heading: text.trim().startsWith("## ") }));
}
// A future retriever can consume this explicit PUBLIC projection only. No client records or draft fields.
export function knowledgePassages(article: PublicArticle) {
    return knowledgeTextBlocks(article.body).map(block => ({
        id: `${article.slug}:r${article.revision}:${block.id}`, source: `/knowledge-base/${article.slug}#${block.id}`,
        title: article.title, category: article.category, revision: article.revision,
        reviewedOn: article.reviewedOn, text: block.text,
    }));
}
