import Image from "next/image";
import Link from "next/link";
import { rescueTowRedesign } from "@/components/rescue-tow-comparison";
import { PortfolioCarousel } from "@/components/portfolio-carousel";
export const projects = [
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
    name: "The Orbisy design process",
    image: "/work/orbisy-design-process.webp",
    url: "/web-design",
    alt: "Illustrative Orbisy website design process showing wireframes, visual design, and refinement on desktop and mobile",
    tag: "Orbisy design process · Illustrative concept",
    summary:
      "Your idea, taking shape: wireframe, visual design, then refinement.",
    details:
      "We start by planning the layout around your services and the next step a customer needs to take. Then we explore a visual direction using your brand, content, and imagery. Your feedback helps refine the desktop and mobile experience before development, testing, and launch.",
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
    name: "Orbisy operations dashboard",
    image: "/work/orbisy-operations-dashboard.svg",
    url: "/custom-development",
    alt: "Work-in-progress Orbisy custom software dashboard concept showing sample inquiries, projects, follow-ups, and workflow activity",
    tag: "Custom software · Work in progress",
    summary: "Custom software you didn’t know you needed.",
    details:
      "The spreadsheet you keep updating. The inquiry that gets lost between tools. The follow-up you have to remember. Orbisy builds custom software around the overlooked parts of running your business. This work-in-progress dashboard concept explores bringing inquiries, project progress, and next steps into one useful workspace. It is an illustrative direction with sample data; the features shown are not live.",
    points: [
      "Start with the friction: repeated tasks, scattered information, and missed handoffs",
      "Design around your team’s workflow, with only the features you need",
      "Scope dashboards, client portals, integrations, and automation around the problem",
    ],
  },
] as const;
export function Portfolio({
  full = false,
  carousel = false,
}: {
  full?: boolean;
  carousel?: boolean;
}) {
  const cards = projects.map((p) => (
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
              Real businesses.
              <br />
              Work you can explore.
            </h2>
          </div>
          <p>
            Live website work, the Orbisy design process, and a custom dashboard
            concept in progress. Concepts are labeled; campaign results are not
            presented here.
          </p>
        </div>
        {carousel ? (
          <PortfolioCarousel names={projects.map((p) => p.name)}>
            {cards}
          </PortfolioCarousel>
        ) : (
          <div className="portfolio-grid">{cards}</div>
        )}
        <p className="portfolio-note">
          Original live-site references captured October 3, 2026; the Rescue Tow
          Truck comparison and redesign preview were captured October 29, 2026.
          Website content may change after capture. The design-process artwork and work-in-progress dashboard are illustrative; dashboard data is sample data.
        </p>
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
        <figure className="process-artwork">
          {image}
          <figcaption>
            {p.kind === "work-in-progress"
              ? "Work in progress · Visual dashboard concept with sample data. Not a live application or completed client project."
              : "Illustrative design concept — not a live website or completed client project."}
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
