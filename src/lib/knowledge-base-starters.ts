import type { PublicArticle } from "@/lib/knowledge-base";
// Proposed editorial drafts, not client case studies or claims of completed integrations.
export const knowledgeStarters: Omit<PublicArticle, "revision" | "publishedAt" | "reviewedOn">[] = [
    { slug: "planning-an-association-website", category: "websites", title: "What should an association website help people do?", summary: "Plan your navigation around joining, renewing, registering, and finding information—not around your internal departments.", body: `## Start with your audiences

Members, prospective members, sponsors, and event attendees arrive with different questions. Identify the tasks each group needs to complete before deciding on a sitemap.

- Members may need renewal links, resources, and event information.
- Prospective members need a clear explanation of eligibility, benefits, and how to join.
- Sponsors and exhibitors need opportunities, requirements, and a contact path.
- Attendees need dates, registration, accessibility information, and program details.

## Decide where each task happens

Your public website does not need to replace your membership or registration platform. A clear link to the right existing system may be the best first step. More connected experiences need a separate feasibility review.

## Make staff editing part of the scope

Identify who updates pages, resources, and events. Orbisy can scope an appropriate content editing workflow, templates, permissions, and handover so routine changes do not always require a developer.

## Bring these items to discovery

Share your current website, priority audiences, common member questions, content owners, existing platforms, and launch constraints. These inputs help define a useful website project.` },
    { slug: "staff-editable-website-content", category: "websites", title: "Will our staff be able to edit website content?", summary: "Staff editing is part of the website discussion. Agree on the content, permissions, and handover your organization needs.", body: `## Define routine changes first

List what staff update frequently: text, leadership information, resources, events, or sponsor information. An appropriate CMS and structured templates can make those updates manageable.

## Agree on editing boundaries

Not every visual element should be freely editable. Reusable layouts can help protect consistency while allowing the updates staff actually need. User permissions, draft review, and publication responsibilities should be part of the scope.

## Include a practical handover

Agree on which staff members need access, what guidance they will receive, and how to request help. Test common tasks before launch, including changing a page and publishing an update.

## Separate content work from development

Adding content to an agreed template is different from creating a new integration or changing a workflow. The project agreement should make those responsibilities clear.` },
    { slug: "scoping-a-member-portal", category: "members", title: "What can a custom member portal include?", summary: "A portal can focus on a specific member task or staff workflow. Start with the problem and access rules before selecting features.", body: `## Choose a useful first workflow

Possible commissioned features include a member-only resource library, a directory, personalized pages, committee applications, submissions, and staff review queues. These are examples of work Orbisy can scope, not existing Orbisy products.

## Define who can see and change information

Agree on member eligibility, staff roles, approval rules, and what should happen when membership changes. Access control needs server-side enforcement; hiding a link is not sufficient protection.

## Understand where member information lives

Identify the authoritative membership system and the information a portal actually needs. Avoid copying more member information than the workflow requires. Account access, platform capabilities, and data-handling requirements affect the design.

## Start with a bounded project

A single resource or approval workflow can be a more manageable first phase than replacing an entire membership platform. Discovery establishes the scope, dependencies, acceptance criteria, and ongoing responsibilities.` },
    { slug: "connecting-membership-and-event-platforms", category: "integrations", title: "Can Orbisy connect our membership and event platforms?", summary: "Connections may be possible, but a specific platform, API, permission, and vendor review comes before an integration commitment.", body: `## Start with the task, not a list of integrations

Explain what staff repeat today, where information starts, and what needs to happen next. A clear workflow makes it easier to decide whether a link, export, automation, or custom integration is appropriate.

## Platform familiarity is a starting point

Orbisy has familiarity with associations using MemberClicks, Whova, Cadmium, and eShow. This is not a claim of formal partnership, certification, or a completed integration with every platform.

## Check access and vendor requirements

Feasibility depends on available APIs, your account permissions and subscription, vendor approval, rate limits, and the data involved. Single sign-on also depends on compatible authentication capabilities and authorized access on both sides.

## Plan for exceptions and upkeep

Define the source of truth, what data may move, how failures are reviewed, and who maintains the connection when a vendor changes its service. Integration work is quoted after those dependencies are understood.

## What to share initially

Provide platform names and the workflow you want to improve. Do not send API keys, passwords, or member records in the public inquiry form. Access and transfer methods are agreed separately.` },
    { slug: "how-an-orbisy-project-works", category: "process", title: "How does an Orbisy project work?", summary: "Discovery, an agreed scope, focused design and development, testing, and handover provide a practical path from idea to launch.", body: `## Discovery

Discuss your organization, audiences, current systems, content editing needs, and the problem to solve. Identify who can make decisions and any deadlines or vendor dependencies.

## Scope and agreement

Agree in writing on deliverables, exclusions, fees, responsibilities, milestones, and review points. Websites, portals, and integrations receive project-based quotes; no general article commits Orbisy to a particular price or schedule.

## Design and development

Work directly with an Orbisy developer. Review the agreed structure and workflows as the work moves forward. New requirements are evaluated against the scope before they become additional work.

## Testing and launch

Review the agreed user tasks, responsive layouts, accessibility considerations, permissions, and integrations. Confirm staff editing and handover requirements alongside the launch plan.

## Ongoing improvement

Routine care, troubleshooting, and additional development can be scoped separately. Larger new features receive their own agreement rather than being assumed to fit inside website maintenance.` },
    { slug: "website-care-and-development-support", category: "process", title: "What is the difference between website care and ongoing development?", summary: "Routine care keeps agreed systems maintained. Development capacity is for defined improvements, while larger projects need a separate scope.", body: `## Routine care

A care arrangement can cover agreed maintenance and troubleshooting tasks. The specific systems, access, responsibilities, and exclusions should be written down rather than assumed.

## Ongoing development

Where appropriate, an arrangement can reserve defined monthly development capacity for an agreed set of improvements. Priorities, capacity, dependencies, and how additional work is approved should be clear.

## Larger changes

A new portal, major redesign, or substantial integration may need a separate project. Maintenance does not imply unlimited development, continuous availability, or a guaranteed response time.

## Decide what your organization needs

Share the systems you use, the work staff cannot complete themselves, and the improvements you expect. Orbisy can help identify whether routine care, a development arrangement, or a new project is the right conversation.` },
];
export function previewKnowledgeArticles(): PublicArticle[] {
    return knowledgeStarters.map(article => ({ ...article, reviewedOn: "2026-11-16", publishedAt: "2026-11-17T00:00:00.000Z", revision: 1 }));
}
