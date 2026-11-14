export const associationServices = [
  {
    slug: "association-websites", title: "Association websites", shortTitle: "A clearer public website", icon: "website",
    description: "New websites and redesigns that help members, prospective members, sponsors, and event attendees find their next step.",
    headline: "A website that makes your association easier to navigate.",
    intro: "Give each audience a clear path to the information and services they need. Orbisy plans, designs, and builds association websites around your content, staff, and existing systems—with a practical way to keep the site current.",
    deliverables: ["A content and navigation plan for members, prospective members, sponsors, and event attendees", "Responsive page layouts and accessible interface patterns, checked with keyboard and screen sizes", "An appropriate CMS with agreed staff roles, reusable content sections, and editing guidance", "Clear links or scoped connections to joining, renewal, registration, and member resources", "Testing, launch planning, documentation, and a staff editing walkthrough"],
    responsibilities: "Share your audience priorities, content inventory, brand assets, existing website access, platform details, and the people who will edit and approve content. We agree on content migration, copy preparation, and any accessibility requirements before development.",
    scope: "Quoted per project after discovery. Page templates, content migration, CMS licensing, hosting, integrations, revision rounds, and ongoing care are itemized. A website build does not automatically replace your membership or event system.",
    faq: [["Will staff be able to update the website?", "Yes. We choose and scope a CMS around what your staff needs to edit, who can publish, and your hosting and budget. The project includes an agreed editing workflow and handover guidance; content migration and training depth are defined in the proposal."], ["Can we keep our membership or event platform?", "That is the starting point for discovery. We review existing tools and decide whether links, embeds, or custom integration are appropriate. Any connection depends on your platform, access, APIs, and vendor requirements."], ["Does accessible design mean a certification?", "No certification is implied. We agree on the accessibility target and testing scope, use accessible patterns, and review keyboard navigation, labels, contrast, and responsive behavior. Specialist audits can be scoped separately."]],
  },
  {
    slug: "member-portals", title: "Member portals & custom functionality", shortTitle: "A more useful member experience", icon: "members",
    description: "Member-only resources, directories, applications, approvals, and staff tools built around a defined workflow.",
    headline: "Build the member experience your workflow calls for.",
    intro: "When a standard page or form does not fit, Orbisy can develop the missing functionality. Start with the people using it, the information they need, and the steps your staff currently handles by hand.",
    deliverables: ["Workflow mapping and a prioritized feature scope before development", "Member-only resource libraries, directories, or personalized pages where scoped", "Committee applications, submissions, reviews, and approval steps with agreed permissions", "Staff tools, exports, or reporting dashboards based on defined data sources", "Testing of access rules, documentation, and a handover plan"],
    responsibilities: "Identify users, member roles, approval rules, data owners, and the source of membership status. Provide example workflows and access to a test environment where available. We agree on data handling, hosting, and support responsibilities before implementation.",
    scope: "Quoted per project with defined features and milestones. Authentication, permissions, content, data migration, and platform dependencies are assessed first. These are commissioned development services, not an existing Orbisy portal product.",
    faq: [["Is there an Orbisy member portal we can subscribe to?", "No. Orbisy offers custom development, not a finished association software product. A portal or feature is scoped around your organization and systems before it is built."], ["Can access depend on membership status?", "Where the source platform and permissions support it, we can scope an access model around membership status and roles. We define the authoritative data source, update behavior, error cases, and tests first."], ["Can you build a committee application or submission process?", "Yes, as a custom project. We map the form, supporting information, reviewers, decisions, notifications, and staff handoff, then agree on the features and integrations to build."]],
  },
  {
    slug: "integrations", title: "Integrations & connected systems", shortTitle: "Less work between systems", icon: "integrations",
    description: "Scoped connections between your website, membership and event platforms, and the tools your staff uses.",
    headline: "Connect the parts of your association that need to work together.",
    intro: "Reduce repeated entry and disconnected handoffs with a connection that has a clear purpose. Orbisy assesses the source systems, permissions, and data flow before proposing an integration.",
    deliverables: ["A feasibility review of the specific platforms, APIs, account permissions, and vendor requirements", "A defined data map: source of truth, fields, direction, frequency, and exceptions", "Scoped synchronization of member, registration, or submission data where supported", "Single sign-on where the client platforms, identity provider, and account access support it", "Testing of failures, logging, staff handoffs, documentation, and maintenance responsibilities"],
    responsibilities: "Provide platform names and editions, API documentation or a vendor contact, suitable test accounts, access approvals, sample data, and a staff owner for each system. Credentials are exchanged through an agreed secure process, not the initial inquiry form.",
    scope: "Discovery and feasibility come first. Vendor fees, API access, identity setup, data cleanup, implementation, and ongoing maintenance are scoped separately as needed. Familiarity with a platform is not a guarantee that a particular connection is available.",
    faq: [["Do you work with MemberClicks, Whova, Cadmium, and eShow?", "Orbisy’s developer has experience working with associations using these platforms. That is platform familiarity, not a formal partnership, certification, or a claim of a prebuilt Orbisy connector. Each proposed connection needs its own feasibility review."], ["Can you add single sign-on?", "Possibly. We first check the identity provider, supported authentication methods, platform edition, vendor requirements, and your account permissions. We only include SSO after confirming a viable scope."], ["What if there is no suitable API?", "We discuss supported alternatives such as a link, embed, approved import/export, or a narrower workflow. We do not promise synchronization or bypass a vendor’s access requirements."]],
  },
  {
    slug: "ongoing-support", title: "Ongoing development & support", shortTitle: "A practical plan after launch", icon: "support",
    description: "Website care, integration troubleshooting, and agreed development capacity with clear responsibilities and limits.",
    headline: "Keep your website and custom connections useful after launch.",
    intro: "A launch is a starting point. Orbisy can maintain agreed parts of the website, investigate integration issues, and deliver prioritized improvements through a separately scoped support arrangement.",
    deliverables: ["An initial review of the site, integrations, hosting, and current ownership", "Routine care and monitoring appropriate to the agreed platform", "Troubleshooting with a defined escalation path and vendor responsibilities", "A prioritized development queue with agreed monthly capacity when appropriate", "Documentation updates, review conversations, and separately scoped larger projects"],
    responsibilities: "Nominate a staff contact, keep required platform subscriptions active, provide appropriate access, and prioritize requests. We agree on monitoring coverage, response expectations, maintenance windows, and who owns third-party issues.",
    scope: "Routine website care, additional development, and larger projects are distinct scopes. Monthly development capacity is agreed in writing. There is no unlimited development, round-the-clock coverage, or guaranteed response time unless a separate agreement explicitly provides it.",
    faq: [["Can we agree on monthly development capacity?", "Yes, when the work fits an ongoing arrangement. The proposal defines capacity, priorities, scheduling, how time is recorded, unused-time rules, and any cancellation or handover terms."], ["Does routine care include new features?", "No. Routine care covers its listed maintenance and minor-edit allowance. New pages, features, integrations, and substantial troubleshooting are agreed as development work or a separate project."], ["Can you support a site or integration someone else built?", "We start with a review of the code, platform, access, and documentation before accepting a support scope. Some issues may require the original vendor, a remediation project, or a different support provider."]],
  },
] as const;
export type AssociationService = (typeof associationServices)[number];
export const platformFamiliarity = ["MemberClicks", "Whova", "Cadmium", "eShow"] as const;
export const engagementProcess = [
  ["Discovery", "Understand your audiences, staff workflows, content, and existing systems."],
  ["Scope", "Agree on deliverables, dependencies, responsibilities, fees, and milestones."],
  ["Design & develop", "Review page layouts or workflow prototypes, then build the agreed solution."],
  ["Test & launch", "Check navigation, permissions, data flows, and responsive behavior before handover."],
  ["Improve", "Plan routine care or a separate queue of development improvements."],
] as const;
export const associationFaqs = [
  ["Who does Orbisy work with?", "Orbisy is focusing on associations and the membership, event, and staff teams that support them. The existing portfolio includes real website work for local businesses; those projects demonstrate design and development capabilities rather than association case studies."],
  ["Can our staff update website content?", "Yes. A website project includes an appropriate CMS and an agreed editing workflow. We define content types, staff roles, migration, and handover guidance in the scope."],
  ["Do we have to replace our current systems?", "Not necessarily. Discovery starts with the systems you already use. A link, embed, scoped integration, or focused custom feature may be enough; feasibility depends on access and vendor support."],
  ["Do you have association case studies or a ready-made portal?", "Not yet. Orbisy’s developer has experience working with associations using MemberClicks, Whova, Cadmium, and eShow. Orbisy does not claim association client case studies, certified partnerships, prebuilt connectors, or a finished association software product."],
  ["How is a project priced?", "Websites, portals, and integrations receive project-based quotes after discovery. Ongoing care and development are scoped separately. Deliverables, fees, and responsibilities are agreed before paid work begins."],
  ["Who will we work with?", "You work directly with an Orbisy developer. The scope and schedule reflect the capacity available for your project."],
] as const;
