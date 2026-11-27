import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import WorkPage from "@/app/work/page";
import { associationServices } from "@/lib/association-services";
import { AssociationServicePage } from "@/components/association-service-page";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import manifest from "@/app/manifest";
import CampaignPage from "@/app/campaigns/[offer]/page";
describe("Association public positioning", () => {
 it("offers four commissioned services, a coherent home and labeled real work", () => {
 const html = renderToStaticMarkup(<Home/>);
 const doc = new DOMParser().parseFromString(html,"text/html");
 expect(doc.querySelectorAll("h1")).toHaveLength(1);
 expect(doc.querySelector("h1")?.textContent).toContain("Custom websites");
 expect(doc.querySelector("h1")?.textContent).toContain("associations");
 for (const service of associationServices) expect(doc.querySelector(`a[href="/${service.slug}"]`)).toBeTruthy();
 expect(doc.querySelector('[name="currentPlatforms"]')).toBeTruthy();
 expect(doc.querySelector('#contact')).toBeTruthy();
 expect(html).toContain("Discuss your project"); expect(html).toContain("Rescue Battery Shop"); expect(html).toContain("Rescue Tow Truck");
 for(const retired of ["Google Ads", "Local SEO", 'href="/towing-marketing"', 'href="/industries/restaurants"']) expect(html).not.toContain(retired);
 });
 it("gives each service scope, client responsibilities, process and a prefilled inquiry", () => {
 for (const service of associationServices) {
 const doc = new DOMParser().parseFromString(renderToStaticMarkup(<AssociationServicePage service={service}/>),"text/html");
 expect(doc.querySelectorAll('h1')).toHaveLength(1);
 expect(doc.querySelector('select[name="serviceNeeded"] option[selected]')?.textContent).toBe(service.title);
 expect(doc.querySelector('#contact')).toBeTruthy();
 for (const detail of service.deliverables) expect(doc.body.textContent).toContain(detail);
 }
 });
 it("features the dashboard first and links the single tow redesign screenshot to the live site", () => {
 const doc = new DOMParser().parseFromString(renderToStaticMarkup(<WorkPage/>),"text/html");
 const comparison=doc.querySelector('#rescue-tow-truck-comparison')!;
 expect(comparison.querySelectorAll('figure')).toHaveLength(1);
 expect(comparison.querySelector('figure a')?.getAttribute('href')).toBe('https://www.rescuetowtruck.com/');
 expect(comparison.textContent).toContain('not a report of measured changes');
 expect(doc.body.textContent).toContain('does not yet have association case studies');
 expect(doc.querySelectorAll('.portfolio-project')).toHaveLength(5);
 const dashboard = doc.querySelector('#orbisy-operations-dashboard')!;
 expect(dashboard.textContent).toContain('Illustrative dashboard concept with sample data');
 expect(dashboard.compareDocumentPosition(comparison) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 });
 it("keeps private, archived and retired routes out of discovery", async () => {
 const paths=(await sitemap()).map(entry=>new URL(entry.url).pathname);
 expect(paths).toContain('/associations'); expect(paths).toContain('/about');
 for(const service of associationServices) expect(paths).toContain(`/${service.slug}`);
 for(const retired of ['/admin-portal','/google-ads','/local-seo','/industries','/archive']) expect(paths).not.toContain(retired);
 expect(robots().rules).toEqual(expect.arrayContaining([expect.objectContaining({disallow: ['/admin-portal','/api/','/auth/','/campaigns/']})]));
 expect(manifest().description).toContain('associations');
 });
 it("redirects only known legacy campaigns and rejects unknown names", async () => {
 await expect(CampaignPage({params: Promise.resolve({offer:'towing-websites'})})).rejects.toThrow(/NEXT_REDIRECT/);
 for(const offer of ['unknown','constructor','toString']) await expect(CampaignPage({params: Promise.resolve({offer})})).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
 });
});
