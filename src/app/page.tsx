import {
  Code2,
  Globe,
  MapPin,
  MousePointerClick,
  Search,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AgencyContact } from "@/components/agency-contact";
import { PublicFooter, PublicHeader } from "@/components/public-site-shell";
import { TrackLink } from "@/components/track-link";
import { agencyServices } from "@/lib/agency-content";

const serviceIcons = [Globe, MousePointerClick, Search, Code2];
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
                Your business.
                <br />
                <span>A stronger online presence.</span>
              </h1>
              <p className="hero-lede">
                Websites, Google Ads, local SEO, and custom development that
                help service businesses get found and turn interest into
                inquiries.
              </p>
              <div className="hero-actions">
                <TrackLink
                  className="button"
                  href="#contact"
                  eventName="primary_cta_click"
                  componentId="hero_project_request"
                >
                  Discuss your project
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
            <aside
              className="agency-service-panel"
              aria-label="Orbisy services"
            >
              <div className="agency-panel-heading">
                <p className="eyebrow">
                  <span />
                  Built around your goals
                </p>
                <h2>
                  Get found.
                  <br />
                  Make the next step easy.
                </h2>
              </div>
              <div className="agency-panel-list">
                {agencyServices.map((service, index) => {
                  const Icon = serviceIcons[index];
                  return (
                    <div className="agency-panel-item" key={service.id}>
                      <Icon size={23} aria-hidden="true" />
                      <div>
                        <h3>{service.title}</h3>
                        <p>{service.summary}</p>
                      </div>
                      <span className="agency-panel-number">0{index + 1}</span>
                    </div>
                  );
                })}
              </div>
              <p className="agency-panel-footnote">
                Start with the service your business needs. Build from there.
              </p>
            </aside>
          </div>
        </section>

        <section className="section services-section" id="services">
          <div className="container">
            <div className="section-heading split-heading">
              <div>
                <p className="eyebrow">
                  <span />
                  What we do
                </p>
                <h2>
                  Practical services.
                  <br />A clear purpose.
                </h2>
              </div>
              <p>
                Bring your goals. We’ll help you choose the right work and
                define what a useful result looks like.
              </p>
            </div>
            <div className="service-grid">
              {agencyServices.map((service, index) => {
                const Icon = serviceIcons[index];
                return (
                  <article
                    className="service-card"
                    key={service.id}
                    data-analytics-view={service.id}
                  >
                    <div className="service-meta">
                      <span>0{index + 1}</span>
                      <Icon size={22} aria-hidden="true" />
                    </div>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <ul className="agency-deliverables">
                      {service.deliverables.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section work-section" id="who-we-help">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">
                <span />
                Who we work with
              </p>
              <h2>
                Local businesses.
                <br />
                Real customer needs.
              </h2>
              <p>
                From a driver looking for a tow to a customer comparing service
                providers, make your business easier to find and contact.
              </p>
            </div>
            <div className="concept-grid audience-grid">
              <article
                className="concept-card audience-card"
                data-analytics-view="audience_towing"
              >
                <div className="concept-content">
                  <Truck
                    className="agency-audience-icon"
                    size={28}
                    aria-hidden="true"
                  />
                  <h3>Towing & roadside assistance</h3>
                  <p>
                    Call-focused websites and marketing built around your
                    services, coverage area, and the jobs you want.
                  </p>
                  <Link
                    className="text-link audience-link"
                    href="/towing-marketing"
                  >
                    Explore towing marketing
                  </Link>
                </div>
              </article>
              <article
                className="concept-card audience-card"
                data-analytics-view="audience_local_services"
              >
                <div className="concept-content">
                  <MapPin
                    className="agency-audience-icon"
                    size={28}
                    aria-hidden="true"
                  />
                  <h3>Local service businesses</h3>
                  <p>
                    A clear website and local search presence for businesses
                    that serve customers in their community.
                  </p>
                  <a className="text-link audience-link" href="#contact">
                    Tell us about your business
                  </a>
                </div>
              </article>
              <article
                className="concept-card audience-card"
                data-analytics-view="audience_custom_projects"
              >
                <div className="concept-content">
                  <Code2
                    className="agency-audience-icon"
                    size={28}
                    aria-hidden="true"
                  />
                  <h3>Businesses with custom needs</h3>
                  <p>
                    Integrations, workflow tools, and web applications scoped
                    around a specific business problem.
                  </p>
                  <a className="text-link audience-link" href="#contact">
                    Discuss a development project
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section about-section" id="about">
          <div className="container about-layout">
            <figure className="about-portrait">
              <div className="about-image-frame">
                <Image
                  src="/anthony-eaves.jpg"
                  alt="Anthony Eaves, founder of Orbisy"
                  fill
                  sizes="(max-width: 680px) 240px, 300px"
                />
              </div>
              <figcaption>Anthony Eaves · Founder</figcaption>
            </figure>
            <div className="about-copy">
              <p className="eyebrow">
                <span />
                Meet Orbisy
              </p>
              <h2>
                A direct connection
                <br />
                to the person doing the work.
              </h2>
              <p>
                I’m Anthony Eaves, the founder of Orbisy. I build websites and
                software, and help businesses connect their online presence with
                their marketing goals.
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
