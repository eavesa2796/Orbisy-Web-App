export const engagements = [
  {
    slug: "web-design",
    title: "Website design & development",
    shortTitle: "Website projects",
    eyebrow: "A website built around your business",
    headline: "Make your services clear. Make contacting you easy.",
    description:
      "A new website, a focused redesign, or a landing page for a specific service. Built for the customers you serve and the action you want them to take.",
    fit: "For businesses whose current website feels dated, leaves services unclear, or makes simple inquiries difficult.",
    deliverables: [
      "A page plan and content structure agreed before design",
      "Responsive design using your brand, services, and real imagery",
      "Development, accessible navigation, contact forms, and basic technical SEO",
      "Pre-launch checks, a walkthrough, and agreed handover documentation",
    ],
    onboarding: [
      "Review your existing site, customers, service area, and goals.",
      "Agree on pages, content responsibilities, integrations, milestones, and a written quote.",
      "Review the design and working site, then approve launch after testing.",
    ],
    responsibilities:
      "Provide approved service details, logo and images you have rights to use, domain/hosting access where needed, and timely feedback. Copywriting, photography, and additional pages can be scoped separately.",
    pricing:
      "Quoted per project based on page count, content work, functionality, and integrations. Your scope specifies the payment schedule, revision rounds, hosting costs, and any optional maintenance.",
    faq: [
      [
        "Can you improve an existing website?",
        "Yes. We first check the platform and existing code, then recommend a focused improvement or rebuild based on the work needed.",
      ],
      [
        "Who owns the finished site?",
        "Ownership, platform accounts, licenses, and handover are defined in your written agreement before work begins.",
      ],
    ],
    service: "Website design or redesign",
  },
  {
    slug: "google-ads",
    title: "Google Ads / PPC management",
    shortTitle: "Google Ads setup & management",
    eyebrow: "Reach people searching for your services",
    headline: "Match the search, the ad, and the next step.",
    description:
      "Google Search campaign setup and ongoing management for local service businesses. Start with the services you can deliver, the areas you cover, and a landing page that supports the offer.",
    fit: "For businesses ready to invest in paid search, handle incoming calls or inquiries, and review lead quality alongside campaign performance.",
    deliverables: [
      "Account and landing-page review, search themes, geographic targeting, and exclusions",
      "Campaign structure, ad copy, keyword selection, and initial negative keywords",
      "Conversion measurement plan and agreed setup, subject to your consent settings",
      "Ongoing search-term, budget, and ad reviews with understandable reporting",
    ],
    onboarding: [
      "Confirm services, coverage, operating hours, job economics, and lead-handling capacity.",
      "Arrange access to your Google Ads account and website; agree on fees and a separate advertising budget.",
      "Review ads, landing pages, and conversion checks before approving the campaign launch.",
    ],
    responsibilities:
      "You own and fund the advertising account, approve the budget and claims, provide required account access, and respond to inquiries. Share which leads became useful jobs so reporting can reflect business outcomes.",
    pricing:
      "A separately scoped setup fee and recurring management fee based on campaign complexity and agreed work. Advertising spend is paid to Google and is never included in Orbisy’s management fee. Landing-page development and third-party call-tracking subscriptions are itemized separately.",
    faq: [
      [
        "Is ad spend included?",
        "No. Google charges your advertising account directly. Orbisy’s proposal separates setup, management, landing pages, and any third-party tools.",
      ],
      [
        "Do you guarantee leads or results?",
        "No. Performance depends on competition, budget, demand, your offer, and lead handling. We agree on measurement and review actual data.",
      ],
    ],
    service: "Google Ads / PPC management",
  },
  {
    slug: "local-seo",
    title: "Local SEO",
    shortTitle: "Local SEO setup & ongoing work",
    eyebrow: "A clearer local search presence",
    headline: "Help nearby customers understand what you do.",
    description:
      "An initial local search review followed by prioritized improvements to your website and business information. Ongoing work is scoped around the services and locations you actually serve.",
    fit: "For businesses with inaccurate business information, incomplete service pages, or a website that needs a stronger local foundation.",
    deliverables: [
      "A baseline review of your website and available local search information",
      "A prioritized plan for technical issues, service content, and business information",
      "Google Business Profile improvements where eligible and access is available",
      "Agreed recurring content and website updates, with progress reviews",
    ],
    onboarding: [
      "Confirm your real services, business location/service area, and existing profiles.",
      "Review website and profile access, then agree on setup priorities and recurring deliverables.",
      "Make approved changes and review visibility and inquiry data over time.",
    ],
    responsibilities:
      "Provide accurate business information and profile access, approve content, and flag changes to hours, services, or locations. Verification steps may require your direct involvement. Reviews must come from real customers.",
    pricing:
      "Initial setup or cleanup is quoted separately from recurring work. Monthly scope depends on content needs, website condition, and the number of legitimate locations. Additional content and development are agreed before being added.",
    faq: [
      [
        "How quickly will rankings improve?",
        "There is no fixed timetable or ranking guarantee. We document changes and review available data rather than promising a position.",
      ],
      [
        "Can you work on my Google Business Profile?",
        "Yes, where your business is eligible and you can provide the required access. You retain ownership of the profile.",
      ],
    ],
    service: "Local SEO",
  },
  {
    slug: "custom-development",
    title: "Custom development",
    shortTitle: "Custom software & integrations",
    eyebrow: "Solve a specific business problem",
    headline: "Less repeated work. Tools that fit your process.",
    description:
      "Web applications, integrations, and automation designed around a defined workflow. Start with the problem, the people using the tool, and the systems it needs to connect.",
    fit: "For businesses repeating manual tasks, moving information between disconnected tools, or needing functionality their current website cannot support.",
    deliverables: [
      "Discovery notes, workflow requirements, and acceptance criteria",
      "A technical plan with milestones, dependencies, and access requirements",
      "An agreed application, integration, or automation with error handling",
      "Testing, deployment support, documentation, and an agreed handover",
    ],
    onboarding: [
      "Walk through the current process and define the smallest useful improvement.",
      "Check APIs, data requirements, permissions, and third-party costs before quoting the build.",
      "Review milestones, test the agreed use cases, and plan deployment and support.",
    ],
    responsibilities:
      "Provide access to the relevant systems, a person who understands the workflow, approved sample data, and feedback on milestones. Third-party accounts, licenses, and usage charges remain your responsibility unless explicitly included.",
    pricing:
      "Discovery and implementation can be separate engagements. Development is quoted by milestone, fixed scope, or an agreed hourly basis. Ongoing support and additional features have their own scope and fees.",
    faq: [
      [
        "Can you integrate tools we already use?",
        "We first confirm API availability, access permissions, and the terms and limits of each platform.",
      ],
      [
        "What happens after delivery?",
        "Documentation, handover, warranty scope, maintenance, and response expectations are agreed in writing before work starts.",
      ],
    ],
    service: "Custom development or integrations",
  },
] as const;
export type Engagement = (typeof engagements)[number];
