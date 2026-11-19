// Campaign labels describe marketing, never people. No arbitrary URLs, click IDs, or form data.
const campaignLabel = /^[a-z0-9][a-z0-9 _.-]{0,79}$/i;
export function googleCampaignParameters(url: URL) {
  const result: Record<string,string> = {};
  for (const [query,key] of [["utm_source","campaign_source"],["utm_medium","campaign_medium"],["utm_campaign","campaign_name"],["utm_content","campaign_content"],["utm_term","campaign_term"]]) {
    const value=url.searchParams.get(query)?.trim();
    if(value && campaignLabel.test(value) && !/\b\d[\d .-]{7,}\d\b/.test(value)) result[key]=value;
  }
  return result;
}
export const serviceInterests: Record<string,string> = {
  "/association-websites":"association_websites",
  "/member-portals":"member_portals",
  "/integrations":"integrations",
  "/ongoing-support":"ongoing_support",
};
export function measurementPageContext(path: string) {
 const interest=serviceInterests[path];
 return {content_group:interest ? "services" : path === "/" ? "home" : path === "/work" ? "portfolio" : path.startsWith("/knowledge-base") ? "knowledge_base" : path.slice(1).replaceAll("-","_"), service_interest:interest || "not_applicable"};
}
export function classifyMeasurementLink(href: string, origin: string, area: "header"|"footer"|"content") {
 if(/^mailto:info@orbisy\.com(?:\?|$)/i.test(href)) return {event:"contact_link_click" as const,component:"email_contact"};
 let url:URL; try{url=new URL(href,origin);}catch{return undefined;}
 if(url.origin !== origin)return undefined;
 if(url.hash === "#contact")return {event:"primary_cta_click" as const,component:`${area}_consultation`};
 const components:Record<string,string>={"/association-websites":"service_association_websites","/member-portals":"service_member_portals","/integrations":"service_integrations","/ongoing-support":"service_ongoing_support","/work":"portfolio_link","/pricing":"project_pricing_link","/associations":"association_approach_link"};
 const component=components[url.pathname.replace(/\/$/,"")];
 return component ? {event:"secondary_cta_click" as const,component} : undefined;
}
export const campaignDestinations = {
 "/association-websites":"Association websites",
 "/member-portals":"Member portals",
 "/integrations":"Integrations",
 "/ongoing-support":"Ongoing support",
 "/associations":"Association overview",
} as const;
export function buildCampaignUrl(path:string,source:string,medium:string,campaign:string,content:string) {
 if(!Object.hasOwn(campaignDestinations,path)||![source,medium,campaign].every(v=>/^[a-z0-9][a-z0-9_-]{0,63}$/.test(v))||(content&&!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(content)))return undefined;
 const url=new URL(path,"https://www.orbisy.com");
 url.searchParams.set("utm_source",source);url.searchParams.set("utm_medium",medium);url.searchParams.set("utm_campaign",campaign);
 if(content)url.searchParams.set("utm_content",content);
 return {url:url.toString(),suffix:url.searchParams.toString()};
}
