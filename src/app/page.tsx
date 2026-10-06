import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AgencyContact } from "@/components/agency-contact";
import { PublicFooter, PublicHeader } from "@/components/public-site-shell";
import { TrackLink } from "@/components/track-link";
import { engagements } from "@/lib/engagements";
import { Portfolio, projects } from "@/components/portfolio";
import { PortfolioCarousel } from "@/components/portfolio-carousel";

const process = [
  [
    "Understand",
    "Talk through your business, customers, service area, and what you want to improve.",
  ],
  [
    "Plan",
    "Agree on the work, deliverables, budget, and a practical way to measure progress.",
  ],
  [
    "Build & launch",
    "Design, develop, and check the website or campaign before it goes live.",
  ],
  [
    "Measure & improve",
    "Review inquiries and performance, then make informed improvements.",
  ],
] as const;
const faqs = [
  [
    "Do you only work with towing companies?",
    "Towing and roadside assistance are a starting focus. Orbisy also works with other local service businesses and companies needing websites or custom development.",
  ],
  [
    "Can we start with just a website?",
    "Yes. A website or landing page can be a standalone project. Advertising and ongoing SEO can be scoped separately when they fit your goals.",
  ],
  [
    "Is advertising spend included in your fee?",
    "Google Ads spend is separate from Orbisy’s setup and management fees. Your proposal will explain the work, fees, and recommended advertising budget.",
  ],
  [
    "Can you work with our existing website?",
    "The first conversation will help determine whether targeted improvements, a new landing page, or a rebuild makes the most sense.",
  ],
  [
    "Do you guarantee rankings or a certain number of leads?",
    "No. Results depend on your market, budget, offer, competition, and how inquiries are handled. We agree on the scope and measurement before work begins.",
  ],
  [
    "What does a project cost?",
    "Pricing depends on the work involved. Share your goals, timeline, and budget, and Orbisy will respond with a suitable next step and a written scope before paid work begins.",
  ],
] as const;

export default function Home() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="agency-home">
        <section className="hero agency-hero" id="top">
          <div className="hero-grid" aria-hidden="true" />
          <div className="container hero-layout">
            <div className="hero-copy">
              <p className="eyebrow">
                <span />
                Web design & digital marketing
              </p>
              <h1>
                Websites and Google Ads
                <br />
                <span>for local service businesses.</span>
              </h1>
              <p className="hero-lede">
                Web design, paid search, local SEO, and custom development with
                Orbisy. A specialty in towing and roadside assistance, with room
                for the other businesses that keep your community moving.
              </p>
              <div className="hero-actions">
                <TrackLink
                  className="button"
                  href="#contact"
                  eventName="primary_cta_click"
                  componentId="hero_project_request"
                >
                  Request a consultation
                </TrackLink>
                <TrackLink
                  className="text-link"
                  href="/towing-marketing"
                  eventName="secondary_cta_click"
                  componentId="hero_towing"
                >
                  For towing businesses
                </TrackLink>
              </div>
              <ul className="hero-points" aria-label="How Orbisy works">
                <li>Clear project scopes</li>
                <li>Direct communication</li>
                <li>Chicago-based</li>
              </ul>
            </div>
            <aside className="hero-project">
              <p className="eyebrow">
                <span />
                Orbisy’s portfolio
              </p>
              <PortfolioCarousel compact names={projects.map((p) => p.name)}>
                {projects.map((project, index) => (
                  <div key={project.name}>
                    <Link
                      href={`/work#${index === 0 ? "rescue-battery-shop" : "rescue-tow-truck"}`}
                      className="hero-project-image"
                    >
                      <Image
                        src={project.image}
                        alt={`${project.name} website from Orbisy’s portfolio`}
                        width={1348}
                        height={926}
                        priority={index === 0}
                        sizes="(max-width: 980px) 100vw, 45vw"
                      />
                    </Link>
                    <div className="hero-slide-copy">
                      <h2>{project.name}</h2>
                      <p>{project.summary}</p>
                      <Link className="text-link" href="/work">
                        Explore Orbisy’s website work →
                      </Link>
                    </div>
                  </div>
                ))}
              </PortfolioCarousel>
            </aside>
          </div>
        </section>

        <section className="section services-section" id="services">
          <div className="container">
            <div className="section-heading split-heading">
              <div>
                <p className="eyebrow">
                  <span />
                  Ways to work together
                </p>
                <h2>
                  Start with the work
                  <br />
                  your business needs.
                </h2>
              </div>
              <p>
                A defined project or ongoing support. Agree on the deliverables,
                responsibilities, and fees before work begins.
              </p>
            </div>
            <div className="engagement-list">
              {engagements.map((e, i) => (
                <Link
                  className="engagement-row"
                  href={`/${e.slug}`}
                  key={e.slug}
                >
                  <span className="engagement-number">0{i + 1}</span>
                  <div>
                    <h3>{e.shortTitle}</h3>
                    <p>{e.description}</p>
                  </div>
                  <span className="engagement-arrow" aria-hidden="true">
                    ↗
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <Portfolio carousel />
        <section className="section specialty-section">
          <div className="container scope-layout">
            <div>
              <p className="eyebrow">
                <span />
                Towing & roadside assistance
              </p>
              <h2>
                Built around the call
                <br />
                and the service area.
              </h2>
            </div>
            <div>
              <p>
                Emergency towing, battery service, equipment transport, or
                another local service: customers need to know what you handle,
                where you work, and how to reach you. We start with those
                details.
              </p>
              <Link className="text-link" href="/towing-marketing">
                Explore towing marketing →
              </Link>
              <p className="portfolio-note">
                Also working with trades, home services, and businesses with
                custom software needs.
              </p>
            </div>
          </div>
        </section>
        <section className="section about-section" id="about">
          <div className="container about-layout">
            <figure className="about-collage">
              <Image
                src="/orbisy-about.webp"
                alt="Orbisy branding with its founder and the Chicago skyline"
                width={1448}
                height={1086}
                sizes="(max-width: 980px) 100vw, 55vw"
              />
            </figure>
            <div className="about-copy">
              <p className="eyebrow">
                <span />
                Meet Orbisy
              </p>
              <h2>
                Built in Chicago.
                <br />
                Built around your business.
              </h2>
              <p>
                Started in 2026, Orbisy builds websites and software, and helps
                businesses connect their online presence with their marketing
                goals.
              </p>
              <p>
                We start with a conversation about your business, agree on a
                clear scope, and keep you informed as the work moves forward.
              </p>
              <div className="about-location">
                <MapPin size={18} aria-hidden="true" />
                Chicago, Illinois · Working locally and remotely
              </div>
            </div>
          </div>
        </section>

        <section className="section process-section" id="process">
          <div className="container">
            <div className="section-heading split-heading">
              <div>
                <p className="eyebrow">
                  <span />
                  How we work
                </p>
                <h2>
                  From first conversation
                  <br />
                  to the next improvement.
                </h2>
              </div>
              <p>
                A defined project, an agreed plan, and a useful way to follow
                progress.
              </p>
            </div>
            <ol className="process-grid">
              {process.map(([title, text], index) => (
                <li key={title}>
                  <span>0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <AgencyContact />
        <section className="section faq-section" id="faq">
          <div className="container faq-layout">
            <div className="section-heading">
              <p className="eyebrow">
                <span />
                Before we begin
              </p>
              <h2>A few useful answers.</h2>
            </div>
            <div className="faq-list">
              {faqs.map(([question, answer], index) => (
                <details key={question} data-faq-index={index}>
                  <summary>
                    {question}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
