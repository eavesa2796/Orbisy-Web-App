import Image from "next/image";
import Link from "next/link";
import { rescueTowRedesign } from "@/components/rescue-tow-comparison";
import { PortfolioCarousel } from "@/components/portfolio-carousel";
import {
  AssociationDashboardGraphic,
  AssociationOfferBanner,
  DesignProcessBanner,
} from "@/components/portfolio-graphics";
export const projects = [
  {
    id: "association-website-concept",
    kind: "concept",
    width: 1672,
    height: 941,
    name: "Association website concept",
    image: "/orbisy-association-concept.webp",
    url: "/work/association-website-concept",
    alt: "Illustrative Orbisy association website concept artwork; sample design, not client work",
    tag: "Association website · Illustrative concept",
    summary: "A clear route from public information to member services.",
    details:
      "An illustrative association concept that shows how a public website, member portal, and connected systems can support different member and staff needs. The right scope depends on your content, workflows, access rules, and existing platforms.",
    points: [
      "Help prospective members understand membership and next steps",
      "Give members a clear starting point for events and resources",
      "Make portal and system handoffs explicit before connecting services",
    ],
  },
  {
    id: "rescue-battery-shop",
    kind: "website",
    width: 1348,
    height: 926,
    alt: "Rescue Battery Shop homepage screenshot captured October 3, 2026",
    name: "Rescue Battery Shop",
    image: "/work/rescue-battery-shop.jpg",
    url: "https://rescuebatteryshop.com/",
    tag: "Mobile battery service · Charlotte",
    summary: "A direct path from battery trouble to requesting help.",
    details:
      "The site explains jump starts and replacement services, lists regional coverage, and gives visitors prominent call links and a form that prepares a text message on their device.",
    points: [
      "Clear distinction between jump starts and battery replacement",
      "Service area and installation steps explained in plain language",
      "Call and text request options with their behavior explained",
    ],
  },
  {
    id: "rescue-tow-truck",
    kind: "website",
    width: 1348,
    height: 926,
    alt: "Rescue Tow Truck homepage screenshot captured October 3, 2026",
    name: "Rescue Tow Truck",
    image: "/work/rescue-tow-truck.jpg",
    url: "https://www.rescuetowtruck.com/",
    tag: "Towing & roadside assistance · Charlotte",
    summary: "Specialized services with a visible route to calling.",
    details:
      "The site presents local towing and roadside assistance alongside dedicated pages for low-clearance towing, heavy-duty towing, and industrial equipment transport. FAQs help visitors understand the available services.",
    points: [
      "Dedicated pages for distinct towing needs",
      "Local service context and prominent phone links",
      "Roadside assistance information and useful FAQs",
    ],
  },
  {
    id: "orbisy-design-process",
    kind: "concept",
    width: 1586,
    height: 992,
    name: "Your idea, taking shape",
    image: "/work/orbisy-design-process.webp",
    url: "/association-websites",
    alt: "Illustrative Orbisy website design process showing wireframes, visual design, and refinement on desktop and mobile",
    tag: "Orbisy design process · Illustrative concept",
    summary:
      "Your idea, taking shape: wireframe, visual design, then refinement.",
    details:
      "We start by planning the layout around your content and the next step a visitor needs to take. Then we explore a visual direction using your brand, content, and imagery. Your feedback helps refine the desktop and mobile experience before development, testing, and launch.",
    points: [
      "Wireframe: agree on the page structure and content priorities",
      "Visual design: explore typography, color, imagery, and the direction",
      "Refine: review the design together and prepare it for implementation",
    ],
  },
  {
    id: "orbisy-operations-dashboard",
    kind: "work-in-progress",
    width: 1600,
    height: 1000,
    name: "Association operations dashboard",
    image: "/work/orbisy-operations-dashboard.svg",
    url: "/member-portals",
    alt: "Illustrative association dashboard showing sample membership, renewal, event, and application numbers",
    tag: "Association software · Illustrative dashboard concept",
    summary: "A sample view of the member and event work an association manages.",
    details:
      "This illustrative dashboard concept explores how an association team could keep membership renewals, applications, event registrations, and member resources in view. All numbers are sample data. This is a design concept, not a live Orbisy product or a completed client project.",
    points: [
      "See membership and renewal activity at a glance",
      "Keep applications, events, and member resources easier to track",
      "Scope roles, data sources, and integrations around the association’s workflow",
    ],
  },
] as const;
export function Portfolio({
  full = false,
  carousel = false,
  excludeProjectIds = [],
}: {
  full?: boolean;
  carousel?: boolean;
  excludeProjectIds?: ReadonlyArray<(typeof projects)[number]["id"]>;
}) {
  const visibleProjects = projects.filter((p) => !excludeProjectIds.includes(p.id));
  const cards = visibleProjects.map((p) => (
    <PortfolioProject key={p.name} project={p} full={full} />
  ));
  return (
    <section className="section portfolio-section" id="work">
      <div className="container">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">
              <span />
              Orbisy’s portfolio
            </p>
            <h2>
              Real projects.
              <br />
              Implementation you can explore.
            </h2>
          </div>
          <p>
            Two client website projects show completed work. The association website concept is illustrative, not client work; software concepts are labeled separately.
          </p>
        </div>
        {carousel ? (
          <PortfolioCarousel names={visibleProjects.map((p) => p.name)}>
            {cards}
          </PortfolioCarousel>
        ) : (
          <div className="portfolio-grid">{cards}</div>
        )}
        <p className="portfolio-note">
          Original live-site references captured October 3, 2026; the Rescue Tow
          Truck comparison and redesign preview were captured October 29, 2026.
          Website content may change after capture. The association website concept and design-process artwork are illustrative; dashboard data is sample data and the dashboard is not a live product.
        </p>
      </div>
    </section>
  );
}

export function PortfolioDashboardFeature() {
  const project = projects.find((p) => p.id === "orbisy-operations-dashboard");

  if (!project) return null;

  return (
    <section className="section portfolio-section" aria-label="Association dashboard concept">
      <div className="container">
        <PortfolioProject project={project} full />
      </div>
    </section>
  );
}

export function PortfolioProject({
  project,
  full = false,
}: {
  project: (typeof projects)[number];
  full?: boolean;
}) {
  const isTowRedesign = full && project.id === "rescue-tow-truck";
  const p = isTowRedesign
    ? { ...project, ...rescueTowRedesign }
    : project;
  const image = (
    <Image
      src={p.image}
      alt={p.alt}
      width={p.width}
      height={p.height}
      sizes="(max-width: 800px) 100vw, 60vw"
    />
  );
  return (
    <article
      className={`portfolio-project${p.kind !== "website" ? " portfolio-process" : ""}`}
      id={p.id}
    >
      {p.kind === "website" ? (
        <a
          className="project-screen"
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${p.name} ${isTowRedesign ? "redesign preview" : "website"} (opens in a new tab)`}
        >
          <div className="browser-strip" aria-hidden="true">
            <i />
            <i />
            <i />
            <span>{new URL(p.url).hostname}</span>
          </div>
          {image}
        </a>
      ) : (
        <figure className={`process-artwork process-artwork-${p.id}`}>
          {p.id === "association-website-concept" ? (
            <AssociationOfferBanner />
          ) : p.id === "orbisy-design-process" ? (
            <DesignProcessBanner />
          ) : p.id === "orbisy-operations-dashboard" ? (
            <AssociationDashboardGraphic />
          ) : image}
          <figcaption>
            {p.kind === "work-in-progress"
              ? "Illustrative dashboard concept with sample data · Not a live product or completed client project."
              : p.id === "association-website-concept"
                ? "Illustrative overview of association website, member portal, and integration services — not client work."
                : "Illustrative design process — not a live website or completed client project."}
          </figcaption>
        </figure>
      )}
      <div className="project-copy">
        <p className="eyebrow">{p.tag}</p>
        <h3>{p.name}</h3>
        <p className="project-summary">{p.summary}</p>
        {(full || p.kind !== "website") && (
          <>
            <p>{p.details}</p>
            <ul>
              {p.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </>
        )}
        {p.kind === "website" ? (
          <a
            className="text-link"
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {isTowRedesign ? "Explore redesign preview ↗" : "Visit live website ↗"}
          </a>
        ) : (
          <Link className="text-link" href={p.url}>
            {p.kind === "work-in-progress" ? "Explore custom software →" : "Explore website design →"}
          </Link>
        )}
        {!full && (
          <Link className="text-link" href={`/work#${p.id}`}>
            {p.kind === "concept"
              ? "Explore our design process"
              : p.kind === "work-in-progress" ? "Explore the dashboard concept" : "Project details"}{" "}
            →
          </Link>
        )}
      </div>
    </article>
  );
}
