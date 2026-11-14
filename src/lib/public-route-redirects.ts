import { industries } from "./industries";
import { campaigns } from "./campaigns";
// Explicit permanent destinations preserve known inbound links; unknown slugs remain 404.
export const legacyPublicRedirects = [
 ["/web-design", "/association-websites"],
 ["/custom-development", "/member-portals"],
 ["/automated-follow-up", "/integrations"],
 ["/website-maintenance", "/ongoing-support"],
 ["/google-ads", "/services"],
 ["/local-seo", "/services"],
 ["/towing-marketing", "/work"],
 ["/industries", "/associations"],
 ...industries.map(({slug})=>[`/industries/${slug}`, "/work"]),
 ...Object.keys(campaigns).map(offer=>[`/campaigns/${offer}`, "/associations"]),
].map(([source,destination])=>({source,destination,permanent:true}));
