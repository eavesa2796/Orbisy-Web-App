import type { MetadataRoute } from "next";
import { industries } from "@/lib/industries";
import { siteConfig } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/web-design",
    "/google-ads",
    "/local-seo",
    "/custom-development",
    "/automated-follow-up",
    "/website-maintenance",
    "/industries",
    ...industries.map((industry) => `/industries/${industry.slug}`),
    "/towing-marketing",
    "/work",
    "/pricing",
    "/privacy",
    "/terms",
  ].map((path, index) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
    changeFrequency: index === 0 ? "monthly" : "yearly",
    priority: index === 0 ? 1 : index === 1 ? 0.8 : 0.3,
  }));
}
