import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { industries } from "@/lib/industries";
import { industryNavigation, serviceNavigation } from "@/lib/public-navigation";
import { IndustryPage } from "@/components/industry-page";
import { projects, Portfolio } from "@/components/portfolio";
import {
  generateMetadata,
  generateStaticParams,
} from "@/app/industries/[industry]/page";
import sitemap from "@/app/sitemap";

describe("Industry pages and honest portfolio evidence", () => {
  it("generates every linked industry with its own metadata, useful content, and inquiry context", async () => {
    const paths = sitemap().map((item) => new URL(item.url).pathname);
    expect(industryNavigation).toHaveLength(8);
    expect(serviceNavigation).toHaveLength(6);
    expect(generateStaticParams()).toHaveLength(7);
    for (const industry of industries) {
      const html = renderToStaticMarkup(<IndustryPage industry={industry} />);
      expect(html).toContain(industry.headline.replaceAll("&", "&amp;"));
      expect(html).toContain(industry.priorities[0][0]);
      expect(html).toContain('id="contact"');
      expect(html).toContain(
        `Industry: ${industry.name.replaceAll("&", "&amp;")}.`,
      );
      expect(paths).toContain(`/industries/${industry.slug}`);
      const metadata = await generateMetadata({
        params: Promise.resolve({ industry: industry.slug }),
      });
      expect(metadata.alternates).toEqual({
        canonical: `/industries/${industry.slug}`,
      });
      if (!industry.evidence)
        expect(html).toContain("not case studies or results for this industry");
    }
  });
  it("rejects unknown industry routes rather than creating generic pages", async () => {
    for (const industry of ["unknown", "constructor", "toString"])
      await expect(
        generateMetadata({ params: Promise.resolve({ industry }) }),
      ).rejects.toThrow();
  });
  it("adds the supplied concept as a third portfolio slide with a unique anchor and explanation", () => {
    expect(projects).toHaveLength(3);
    const html = renderToStaticMarkup(<Portfolio carousel />);
    expect(html).toContain('id="orbisy-design-process"');
    expect(html).toContain("orbisy-design-process.webp");
    expect(html).toContain("not a live website or completed client project");
    expect(html).toContain("Wireframe: agree on the page structure");
    expect(new Set(projects.map((project) => project.id)).size).toBe(
      projects.length,
    );
  });
});
