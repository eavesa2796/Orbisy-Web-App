import Image from "next/image";
import Link from "next/link";
import { PortfolioCarousel } from "@/components/portfolio-carousel";
export const projects = [
  {
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
] as const;
export function Portfolio({
  full = false,
  carousel = false,
}: {
  full?: boolean;
  carousel?: boolean;
}) {
  const cards = projects.map((p, index) => (
    <PortfolioProject key={p.name} project={p} index={index} full={full} />
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
            Website projects from Orbisy’s portfolio. These examples show the
            implementation and visitor experience; campaign results are not
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
          Live-site screenshots captured October 3, 2026. Website content may
          change after capture.
        </p>
      </div>
    </section>
  );
}

export function PortfolioProject({
  project: p,
  index,
  full = false,
}: {
  project: (typeof projects)[number];
  index: number;
  full?: boolean;
}) {
  return (
    <article
      className="portfolio-project"
      id={index === 0 ? "rescue-battery-shop" : "rescue-tow-truck"}
    >
      <a
        className="project-screen"
        href={p.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`View ${p.name} website (opens in a new tab)`}
      >
        <div className="browser-strip" aria-hidden="true">
          <i />
          <i />
          <i />
          <span>{new URL(p.url).hostname}</span>
        </div>
        <Image
          src={p.image}
          alt={`${p.name} homepage screenshot captured October 3, 2026`}
          width={1348}
          height={926}
          sizes="(max-width: 800px) 100vw, 60vw"
        />
      </a>
      <div className="project-copy">
        <p className="eyebrow">{p.tag}</p>
        <h3>{p.name}</h3>
        <p className="project-summary">{p.summary}</p>
        {full && (
          <>
            <p>{p.details}</p>
            <ul>
              {p.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </>
        )}
        <a
          className="text-link"
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit live website ↗
        </a>
        {!full && (
          <Link
            className="text-link"
            href={`/work#${index === 0 ? "rescue-battery-shop" : "rescue-tow-truck"}`}
          >
            Project details →
          </Link>
        )}
      </div>
    </article>
  );
}
