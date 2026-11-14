import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { associationServices } from "@/lib/association-services";
export default function sitemap(): MetadataRoute.Sitemap {
 return ["", "/services", "/associations", ...associationServices.map(s => `/${s.slug}`), "/about", "/work", "/pricing", "/privacy", "/terms"].map((path,index)=>({url: `${siteConfig.url}${path}`, changeFrequency: "monthly", priority: index === 0 ? 1 : 0.6}));
}
