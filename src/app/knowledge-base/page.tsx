import type { Metadata } from "next";
import { KnowledgeIndex } from "@/components/knowledge-base";
import { getPublicKnowledge, knowledgePreview } from "@/lib/data/knowledge-base";
import { knowledgeCategories } from "@/lib/knowledge-base";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Knowledge base", description: "Practical guides for association websites, member portals, connected systems, and development projects.", alternates: { canonical: "/knowledge-base" }, twitter: { card: "summary_large_image", title: "Orbisy knowledge base", description: "Practical guides for association websites, portals, and connected systems." }, openGraph: { title: "Orbisy knowledge base", description: "Clear answers for association website and workflow projects.", url: "/knowledge-base" }, ...(knowledgePreview ? { robots: { index: false, follow: false } } : {}) };
export default async function KnowledgePage({ searchParams }: {
    searchParams: Promise<{
        q?: string;
        topic?: string;
    }>;
}) {
    const params = await searchParams;
    const query = typeof params.q === "string" ? params.q.slice(0, 120).trim() : "";
    const topic = typeof params.topic === "string" && Object.hasOwn(knowledgeCategories, params.topic) ? params.topic : "";
    let articles: Awaited<ReturnType<typeof getPublicKnowledge>> = [];
    let unavailable = false;
    try {
        articles = await getPublicKnowledge();
    }
    catch {
        unavailable = true;
    }
    return <KnowledgeIndex key={`${query}:${topic}`} articles={articles} query={query} topic={topic} preview={knowledgePreview} unavailable={unavailable}/>;
}
