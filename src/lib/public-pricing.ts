// Deliberately public offers. Never import the private administrator pricing catalog here.
// Approved public subscriptions. Initial builds and onboarding are quoted separately.
export const subscriptionPlans = [
  {
    id: "starter", name: "Starter", price: "$299", billing: "per month",
    fit: "A maintained online presence.",
    description: "Keep your website current, cared for, and ready for the next inquiry.",
    service: "Website design or redesign",
    features: [
      "Website monitoring, care, and applicable software updates",
      "Up to one hour of minor website edits each month",
      "Basic local business-information review during onboarding",
      "Monthly website and inquiry summary, using available consented data",
    ],
    scope: "For one compatible business website. New website construction, major fixes, and initial onboarding are quoted separately. Advertising management and recurring SEO work are not included.",
    priceSummary: "$299/month; website build, onboarding, and third-party costs separate",
    featured: false,
  },
  {
    id: "growth", name: "Growth", price: "$999", billing: "per month",
    fit: "Website support and ongoing marketing.",
    description: "Connect your website, local visibility, advertising, and the first response to an inquiry.",
    service: "Website and marketing package",
    features: [
      "Everything in Starter, including its monthly website-edit allowance",
      "Google Ads management: one account, one local market, up to two Search campaigns",
      "Ongoing local SEO for one business location, with monthly priorities and deliverables agreed in writing",
      "One basic inquiry acknowledgment and owner-notification workflow",
      "Monthly performance review and next-step priorities",
    ],
    scope: "Campaign and workflow setup are part of separately quoted onboarding. Google Ads management is included in the plan fee; ad spend is additional, paid directly to Google. Paid tools and messaging usage are separate.",
    priceSummary: "$999/month; onboarding, ad spend, and third-party costs separate",
    featured: true,
  },
  {
    id: "complete", name: "Complete", price: "$2,499", billing: "per month",
    fit: "One partner across Orbisy’s services.",
    description: "One partner for your website, marketing, and the software connecting it all.",
    service: "Website and marketing package",
    features: [
      "Everything in Growth, including its account and location limits",
      "Four hours of custom development each month, prioritized through one request queue",
      "A monthly website, landing-page, and SEO improvement plan with agreed capacity",
      "Expanded follow-up workflows and integrations within the written scope",
      "Priority scheduling and a monthly planning conversation",
    ],
    scope: "Access to every service category with defined monthly capacity. Large software projects, new website builds, extra locations, onboarding, ad spend, and third-party costs are quoted separately. Priority scheduling does not mean 24/7 support or a guaranteed response time.",
    priceSummary: "$2,499/month; onboarding, ad spend, third-party costs, and larger projects separate",
    featured: false,
  },
] as const;

export const publicPackages = [
  {
    id: "landing-page",
    name: "Landing Page",
    price: "$1,250",
    billing: "one-time",
    service: "Website design or redesign",
    fit: "One service. One focused next step.",
    description:
      "A dedicated page for a service, offer, or advertising campaign.",
    features: [
      "One responsive page focused on one service or offer",
      "Your branding, supplied content, and clear call buttons",
      "Inquiry form and basic on-page SEO",
      "Two consolidated revision rounds and launch checks",
    ],
    scope:
      "Full copywriting, hosting, paid tools, and integrations are quoted separately.",
    detailHref: "/web-design",
    priceSummary: "$1,250 one-time",
    featured: false,
  },
  {
    id: "business-website",
    name: "Business Website",
    price: "$2,500",
    billing: "one-time",
    service: "Website design or redesign",
    fit: "Recommended for a complete business website",
    description:
      "A clear home for your services, your work, and your next customer.",
    features: [
      "Up to five responsive pages using your branding",
      "Page planning and organization of supplied content",
      "Inquiry form, call buttons, and basic technical/on-page SEO",
      "Two consolidated revision rounds, launch checks, and handover",
    ],
    scope:
      "Extra pages, full copywriting, hosting, paid tools, and integrations are quoted separately.",
    detailHref: "/web-design",
    priceSummary: "$2,500 one-time",
    featured: true,
  },
  {
    id: "google-ads",
    name: "Google Ads",
    price: "$500",
    billing: "per month",
    service: "Google Ads / PPC management",
    fit: "For businesses ready to invest in paid search",
    description:
      "Launch a focused Search campaign, then review and improve it over time.",
    features: [
      "One Google Ads account and one local market",
      "Setup of up to two Search campaigns",
      "Agreed conversion tracking, subject to consent settings",
      "Weekly campaign checks and monthly reporting",
    ],
    setup: "$750 one-time setup",
    scope:
      "Ad spend is paid directly to Google. Landing pages and third-party tracking tools cost extra.",
    detailHref: "/google-ads",
    priceSummary: "$750 setup + $500/month management; ad spend separate",
    featured: false,
  },
] as const;

export const supportingOffers = [
  {
    id: "local-search-foundation",
    name: "Local Search Foundation",
    price: "$650",
    billing: "one-time",
    service: "Local SEO",
    description:
      "A defined starting point for one legitimate business location.",
    features: [
      "Website and local business-information audit",
      "Eligible Google Business Profile cleanup with your access",
      "On-page optimization of up to three existing website pages",
    ],
    scope:
      "New pages, ongoing SEO, paid listings, and major technical fixes are scoped separately. Profile verification may need your involvement.",
    detailHref: "/local-seo",
    priceSummary: "$650 one-time",
  },
  {
    id: "website-care",
    name: "Website Care",
    price: "$125",
    billing: "per month",
    service: "Website design or redesign",
    description: "Keep an existing website maintained and its details current.",
    features: [
      "Website monitoring and applicable software updates",
      "Backups where supported by the agreed platform",
      "Up to 30 minutes of minor content edits each month",
    ],
    scope:
      "Existing sites are reviewed for compatibility first. Hosting, paid tools, new features, and larger changes are quoted separately.",
    detailHref: "/web-design",
    priceSummary: "$125/month",
  },
  {
    id: "custom-development",
    name: "Custom Development",
    price: "Custom quote",
    billing: "per project",
    service: "Custom development or integrations",
    description: "Software shaped around a defined business workflow.",
    features: [
      "Web applications and internal business tools",
      "Integrations between your existing systems",
      "Automation with agreed requirements and milestones",
    ],
    scope:
      "We discuss the workflow, users, access, and technical requirements before quoting. Ongoing support is scoped separately.",
    detailHref: "/custom-development",
    priceSummary: "custom quote",
  },
] as const;

export const pricingAddOns = [
  [
    "Automated lead follow-up",
    "A scoped workflow for inquiry acknowledgment, owner alerts, and appropriate follow-up with human handoff.",
  ],
  [
    "Additional website pages",
    "Extra service, location, or campaign pages beyond your package.",
  ],
  [
    "Copywriting & content",
    "New website copy, content research, or substantial rewriting.",
  ],
  [
    "Campaign landing pages",
    "A page matched to a particular advertising offer; ask about the Landing Page package.",
  ],
  [
    "Integrations & automation",
    "Booking tools, CRM connections, custom forms, and other workflows.",
  ],
  [
    "Ongoing local SEO",
    "An agreed monthly plan for content, website improvements, and progress reviews.",
  ],
  [
    "Extra support & revisions",
    "Larger edits, additional revision rounds, or work beyond your support allowance.",
  ],
] as const;

export function findPublicPackage(value: unknown) {
  if (typeof value !== "string") return undefined;
  return [...subscriptionPlans, ...publicPackages, ...supportingOffers].find(
    (offer) => offer.id === value,
  );
}
