import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { AgencyDashboard } from "@/components/admin/agency-dashboard";
import {
  WorkspaceEditor,
  DiscoveryEditor,
} from "@/components/admin/workspace-editors";
import { briefFields, todayInChicago } from "@/lib/client-workspaces";
import type { getAgencyDashboard } from "@/lib/data/client-workspaces";
import type { clientWorkspaces, discoveryBriefs } from "@/lib/db/schema";
import "../../admin-portal/admin.css";
import "./review.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin workspace design preview",
  robots: { index: false, follow: false, nocache: true },
};
export default async function WorkspaceReview({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  // Fictional visual review only. All real admin routes and writes retain requireAdmin().
  if (
    process.env.VERCEL_ENV !== "preview" &&
    process.env.NODE_ENV !== "development"
  )
    notFound();
  const { view } = await searchParams;
  const today = todayInChicago();
  const sampleLink = "/preview/workspace?view=client";
  const data: Awaited<ReturnType<typeof getAgencyDashboard>> = {
    workspaceReady: true,
    workspaceError: false,
    activeClients: 2,
    today,
    queues: [
      {
        key: "inquiries",
        title: "New inquiries",
        description: "Read the request and arrange a conversation.",
        total: 2,
        items: [
          {
            id: "example-a",
            title: "Example Association",
            detail: "Association website redesign",
            href: sampleLink,
          },
          {
            id: "example-b",
            title: "Example Industry Council",
            detail: "Member resource library",
            href: sampleLink,
          },
        ],
      },
      {
        key: "followups",
        title: "Follow-ups due",
        description: "Scheduled follow-ups for open leads.",
        total: 1,
        items: [
          {
            id: "example-c",
            title: "Example Association",
            detail: "Arrange the discovery conversation",
            date: today,
            urgent: true,
            href: sampleLink,
          },
        ],
      },
      {
        key: "actions",
        title: "Client next actions",
        description: "Client actions scheduled for today or earlier.",
        total: 1,
        items: [
          {
            id: "example-d",
            title: "Example Industry Council",
            detail: "Confirm the content editor and migration owner",
            date: today,
            href: sampleLink,
          },
        ],
      },
      {
        key: "proposals",
        title: "Lead proposals awaiting response",
        description: "Existing leads marked proposal sent.",
        total: 0,
        items: [],
      },
      {
        key: "notifications",
        title: "Notification failures",
        description:
          "Saved inquiries remain available if a notification fails.",
        total: 0,
        items: [],
      },
      {
        key: "milestones",
        title: "Milestones needing attention",
        description: "Blocked work and near-term commitments.",
        total: 1,
        items: [
          {
            id: "example-e",
            title: "Confirm platform API access",
            detail: "Example Association · blocked",
            date: today,
            urgent: true,
            href: sampleLink,
          },
        ],
      },
      {
        key: "clientProposals",
        title: "Client proposals awaiting response",
        description:
          "Workspace proposal status, separate from the lead record.",
        total: 1,
        items: [
          {
            id: "example-f",
            title: "Example Industry Council",
            detail: "Follow up on the proposed website scope",
            href: sampleLink,
          },
        ],
      },
    ],
  };
  const client: typeof clientWorkspaces.$inferSelect = {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Example Association",
    status: "prospect",
    contactName: "Example membership contact",
    contactEmail: "membership@example.test",
    contactRole: "Membership director",
    websiteUrl: "https://example.test",
    cms: "Existing staff-editable CMS",
    platforms:
      "Existing membership platform and event registration tool. Feasibility to be confirmed.",
    vendorContacts:
      "Identify the account owner and vendor contact during discovery.",
    accessNotes:
      "Password manager item reference only; never store credentials here.",
    currentScope:
      "Redesign the public website and scope a member resource library.",
    supportScope: "Routine care will be scoped separately after launch.",
    supportCapacity: "Not yet agreed",
    supportBoundaries:
      "New functionality and integration maintenance need an agreed scope.",
    nextAction: "Confirm the content editor and migration owner",
    nextActionDate: today,
    proposalStatus: "scoping",
    proposalUrl: "",
    version: 1,
    updatedBy: "review@example.test",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const answers = Object.fromEntries(briefFields.map(([key]) => [key, ""]));
  Object.assign(answers, {
    goals:
      "Make membership information easier to find and give staff a practical editing workflow.",
    audiences:
      "Members, prospective members, sponsors, event attendees, and staff.",
    editing:
      "Confirm content types, editing roles, publishing approval, and handover needs.",
    platforms:
      "Review the existing membership and event systems. API access and vendor requirements are not yet confirmed.",
    deliverables:
      "Agreed responsive page templates, staff editing guidance, and defined launch checks.",
    exclusions:
      "No replacement membership system or unverified synchronization promises.",
    responsibilities:
      "Provide approved content, account access, feedback, and test participants.",
    acceptance:
      "Staff can update agreed content; visitors can find membership and event information; scoped access rules pass testing.",
  });
  const brief: typeof discoveryBriefs.$inferSelect = {
    id: "00000000-0000-4000-8000-000000000002",
    workspaceId: client.id,
    title: "Website and workflow discovery",
    status: "draft",
    answers,
    version: 1,
    updatedBy: "review@example.test",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return (
    <AdminShell email="review@example.test" reviewMode>
      <aside className="workspace-review-banner" aria-label="Design preview">
        <strong>Design review · Fictional example data</strong>
        <p>
          This page shows the proposed layout, not live client records. Sample
          forms are disabled. Real administrator pages still require sign-in.
          This review route is unavailable in production.
        </p>
        <nav aria-label="Preview screens">
          <Link
            href="/preview/workspace"
            aria-current={!view ? "page" : undefined}
          >
            Dashboard
          </Link>
          <Link
            href="/preview/workspace?view=client"
            aria-current={view === "client" ? "page" : undefined}
          >
            Client workspace
          </Link>
          <Link
            href="/preview/workspace?view=discovery"
            aria-current={view === "discovery" ? "page" : undefined}
          >
            Discovery brief
          </Link>
        </nav>
      </aside>
      {view === "client" ? (
        <>
          <header className="admin-heading">
            <div>
              <p className="eyebrow">Example client workspace</p>
              <h1>Example Association</h1>
              <p>
                Contacts, systems, scope, next actions, proposals, and ongoing
                support.
              </p>
            </div>
          </header>
          <section className="workspace-overview">
            <article className="workspace-next-action">
              <p className="eyebrow">Next action</p>
              <h2>{client.nextAction}</h2>
              <p>{today}</p>
            </article>
            <article className="admin-card">
              <h2>A connected client record</h2>
              <p className="workspace-preserve">
                The real workspace also links original inquiries, private notes,
                milestones, and saved discovery briefs. Existing lead history
                stays intact.
              </p>
            </article>
          </section>
          <section className="admin-card">
            <fieldset
              disabled
              className="workspace-review-fields"
              aria-label="Read-only sample workspace fields"
            >
              <WorkspaceEditor entry={client} />
            </fieldset>
          </section>
        </>
      ) : view === "discovery" ? (
        <>
          <header className="admin-heading">
            <div>
              <p className="eyebrow">Example discovery brief</p>
              <h1>A scope you can review.</h1>
              <p>
                Save drafts, resolve dependencies, and define what finished
                means.
              </p>
            </div>
          </header>
          <p className="notice">
            In the real workspace, saved briefs can be printed or downloaded.
            Ready for review is an internal planning status, not client
            approval.
          </p>
          <section className="admin-card">
            <fieldset
              disabled
              className="workspace-review-fields"
              aria-label="Read-only sample discovery fields"
            >
              <DiscoveryEditor workspaceId={client.id} entry={brief} />
            </fieldset>
          </section>
        </>
      ) : (
        <AgencyDashboard data={data} />
      )}
    </AdminShell>
  );
}
