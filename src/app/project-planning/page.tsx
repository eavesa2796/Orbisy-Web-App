import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/public-site-shell";
import { ProjectAssistant } from "@/components/project-assistant";
import { discoveryOffer, publicPackages } from "@/lib/public-pricing";
import { PrintBrief } from "./print-brief";
import styles from "./brief.module.css";

export const metadata: Metadata = {
  title: "Association project decision brief",
  description:
    "A practical guide for association leaders to review scope, budget categories, responsibilities, dependencies, and approval questions before commissioning a website or software project.",
  alternates: { canonical: "/project-planning" },
  openGraph: { url: "/project-planning" },
};

const projectTypes = [
  {
    name: "Association website",
    question: "What should each audience be able to find or do?",
    proposal: "Pages and navigation, CMS and editing roles, content migration, links to current systems, testing, and handover.",
  },
  {
    name: "Member portal or workflow",
    question: "Which member or staff task needs a clearer path?",
    proposal: "User roles, one agreed workflow, source of member status or content, access rules, data handling, and acceptance checks.",
  },
  {
    name: "Connected systems",
    question: "What information should move between which systems?",
    proposal: "API and vendor feasibility, source of truth, data mapping, permissions, errors, testing, and ongoing ownership.",
  },
] as const;

const phases = [
  {
    title: "1. Fit conversation",
    detail: "Share the goal, who is affected, and the systems involved. Requesting a conversation does not commit the association to paid work.",
  },
  {
    title: "2. Discovery, if needed",
    detail: "Map workflows, content, access, and feasibility. Any paid discovery is agreed in advance with its fee and deliverables.",
  },
  {
    title: "3. Written proposal",
    detail: "Review scope, assumptions, responsibilities, dependencies, exclusions, fees, payment milestones, and the project schedule before deciding.",
  },
  {
    title: "4. Build and handover",
    detail: "Work proceeds through agreed review points, testing, launch planning, documentation, and staff handover.",
  },
] as const;

const boardQuestions = [
  "Which audience or staff task is the project intended to improve?",
  "Who owns content, approvals, platform access, and the final decision?",
  "Which current membership, event, CMS, or other systems must remain in place?",
  "What will be included, and what is explicitly outside the scope?",
  "Which costs are one-time, recurring, or paid to a third-party vendor?",
  "What dependencies or decisions could change the schedule or estimate?",
  "What testing, documentation, training, and post-launch support are included?",
] as const;

export default function ProjectPlanningPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className={styles.page}>
        <section className={styles.hero}>
          <div className="container">
            <Link className={styles.breadcrumb} href="/pricing">Project pricing</Link>
            <p className="eyebrow">Association project decision brief</p>
            <h1>Take a clearer scope to your board.</h1>
            <p className={styles.lede}>
              Use this guide to review an association website, member portal, or
              integration project before approving discovery or implementation.
            </p>
            <div className={styles.notice}>
              Planning guide only. This is not a quote, proposal, client project,
              or promise of delivery time.
            </div>
            <p className={styles.shareNote}>
              Share this page with your budget owner or save a PDF for your board packet.
            </p>
            <PrintBrief />
          </div>
        </section>

        <section className={styles.brief} aria-labelledby="decision-title">
          <div className="container">
            <div className={styles.decision}>
              <div>
                <p className="eyebrow">The decision</p>
                <h2 id="decision-title">Approve a defined proposal—not an open-ended build.</h2>
              </div>
              <p>
                Before paid work begins, the proposal should make the work,
                fees, responsibilities, dependencies, milestones, and ongoing
                costs clear enough for your organization to decide.
              </p>
            </div>

            <section className={styles.section} aria-labelledby="scope-title">
              <p className="eyebrow">Start with the need</p>
              <h2 id="scope-title">Choose the problem before the feature.</h2>
              <p className={styles.sectionLede}>
                A useful scope starts with the task members or staff need to
                complete. These are common project shapes; each requires
                organization-specific discovery.
              </p>
              <div className={styles.projectGrid}>
                {projectTypes.map((project) => (
                  <article className={styles.projectCard} key={project.name}>
                    <h3>{project.name}</h3>
                    <p className={styles.question}>{project.question}</p>
                    <p><strong>The proposal should define</strong></p>
                    <p>{project.proposal}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.section} aria-labelledby="range-title">
              <p className="eyebrow">Initial budget ranges</p>
              <h2 id="range-title">Use these figures to frame the conversation.</h2>
              <p className={styles.sectionLede}>One-time USD planning ranges, not fixed quotes. The proposal confirms the fee after scope, content, access, and dependencies are reviewed.</p>
              <div className={styles.costGrid}>
                {publicPackages.map((offer) => (
                  <article key={offer.id}>
                    <h3>{offer.name}</h3>
                    <p><strong>{offer.price}</strong> · {offer.billing}</p>
                    <p>{offer.description}</p>
                    <p>{offer.scope}</p>
                  </article>
                ))}
                <article>
                  <h3>{discoveryOffer.name}</h3>
                  <p><strong>{discoveryOffer.price}</strong> · {discoveryOffer.billing}</p>
                  <p>{discoveryOffer.description}</p>
                  <p>{discoveryOffer.scope}</p>
                </article>
              </div>
              <p className={styles.caveat}>Recurring hosting, licenses, vendor fees, content work, and ongoing support may add separate costs. Discovery is only commissioned when useful and agreed in advance.</p>
            </section>

            <section className={styles.section} aria-labelledby="proposal-title">
              <p className="eyebrow">What to ask for in the proposal</p>
              <h2 id="proposal-title">Make costs and responsibilities reviewable.</h2>
              <div className={styles.costGrid}>
                <article>
                  <h3>One-time project work</h3>
                  <p>Discovery, design and development, agreed content or data migration, testing, and handover—itemized to match the scope.</p>
                </article>
                <article>
                  <h3>Recurring and vendor costs</h3>
                  <p>Hosting, CMS or API licenses, event or membership platform fees, and optional website care—shown separately where applicable.</p>
                </article>
                <article>
                  <h3>Assumptions and exclusions</h3>
                  <p>Content supplied by the association, review rounds, platform access, migration limits, custom features, and anything priced separately.</p>
                </article>
                <article>
                  <h3>Schedule and payment</h3>
                  <p>Milestones, approval points, payment timing, and dependencies that could affect delivery are stated in the written proposal.</p>
                </article>
              </div>
              <p className={styles.caveat}>
                The estimate depends on the agreed page count, content readiness,
                CMS, access, migration, functionality, and third-party
                requirements. Vendor feasibility is checked before an
                integration is promised.
              </p>
            </section>

            <section className={styles.section} aria-labelledby="phases-title">
              <p className="eyebrow">How a project moves forward</p>
              <h2 id="phases-title">A sequence of decisions, not a blank check.</h2>
              <ol className={styles.phaseList}>
                {phases.map((phase) => (
                  <li key={phase.title}>
                    <h3>{phase.title}</h3>
                    <p>{phase.detail}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className={styles.section} aria-labelledby="questions-title">
              <p className="eyebrow">Board and budget review</p>
              <h2 id="questions-title">Questions to answer before approval.</h2>
              <ul className={styles.questionList}>
                {boardQuestions.map((question) => <li key={question}>{question}</li>)}
              </ul>
            </section>

            <aside className={styles.notIncluded}>
              <h2>Keep these costs visible.</h2>
              <p>
                A website build does not automatically include a new membership
                or event system, custom portal, API or single sign-on work,
                extensive migration or copywriting, third-party charges, or
                ongoing care. Include them only when the proposal defines the
                need, scope, owner, and cost.
              </p>
            </aside>

            <section className={styles.nextStep}>
              <div>
                <p className="eyebrow">Ready for a scoped conversation?</p>
                <h2>Start with your goal and current systems.</h2>
                <p>
                  Orbisy reviews the request and replies by email to arrange a
                  conversation. A written scope comes before paid implementation.
                </p>
              </div>
              <Link className="button" href="/pricing?package=association-website#contact">
                Discuss an association website
              </Link>
            </section>
          </div>
        </section>
      </main>
      <PublicFooter />
      <ProjectAssistant />
    </>
  );
}
