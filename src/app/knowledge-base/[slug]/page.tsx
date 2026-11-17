import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KnowledgeArticleView } from "@/components/knowledge-base";
import { getPublicKnowledge, knowledgePreview } from "@/lib/data/knowledge-base";
import { articleSlug } from "@/lib/knowledge-base";
export const dynamic = "force-dynamic";
async function findArticle(slug: string) { if (!articleSlug.safeParse(slug).success)
    return undefined; return (await getPublicKnowledge()).find(article => article.slug === slug); }
export async function generateMetadata({ params }: {
    params: Promise<{
        slug: string;
    }>;
}): Promise<Metadata> { const { slug } = await params; const article = await findArticle(slug); return article ? { title: article.title, description: article.summary, alternates: { canonical: `/knowledge-base/${article.slug}` }, twitter: { card: "summary_large_image", title: article.title, description: article.summary }, openGraph: { type: "article", title: article.title, description: article.summary, url: `/knowledge-base/${article.slug}`, modifiedTime: `${article.reviewedOn}T12:00:00Z` }, ...(knowledgePreview ? { robots: { index: false, follow: false } } : {}) } : { title: "Article not found", robots: { index: false, follow: false } }; }
export default async function ArticlePage({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) { const { slug } = await params; const article = await findArticle(slug); if (!article)
    notFound(); const others = (await getPublicKnowledge()).filter(a => a.slug !== slug); const related = [...others.filter(a => a.category === article.category), ...others.filter(a => a.category !== article.category)].slice(0, 2); return <KnowledgeArticleView article={article} related={related} preview={knowledgePreview}/>; }
