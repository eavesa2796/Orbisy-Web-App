import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/restaurants", "/haulers", "/privacy", "/terms"].map((path, index) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
    changeFrequency: index === 0 ? "monthly" : "yearly",
    priority: index === 0 ? 1 : index < 3 ? 0.8 : 0.3,
  }));
}
