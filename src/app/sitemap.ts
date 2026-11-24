import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { associationServices } from "@/lib/association-services";
import { getPublicKnowledge, knowledgePreview } from "@/lib/data/knowledge-base";
export const dynamic="force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 const pages:MetadataRoute.Sitemap=["", "/services", "/associations", ...associationServices.map(s=>`/${s.slug}`), "/about", "/work", "/work/association-website-concept", "/pricing", "/knowledge-base", "/privacy", "/terms"].map((path,index)=>({url:`${siteConfig.url}${path}`,changeFrequency:"monthly",priority:index===0?1:0.6}));
 if(!knowledgePreview){try{const articles=await getPublicKnowledge();pages.push(...articles.map(article=>({url:`${siteConfig.url}/knowledge-base/${article.slug}`,lastModified:article.publishedAt,changeFrequency:"monthly" as const,priority:0.5})));}catch{/* Preserve existing site URLs when the article database is unavailable. */}}
 return pages;
}
