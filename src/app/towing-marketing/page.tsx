import Link from "next/link";
import type { Metadata } from "next";
import {
  Check,
  Globe,
  MapPin,
  MousePointerClick,
  Phone,
  Truck,
} from "lucide-react";
import { Portfolio } from "@/components/portfolio";
import { AgencyContact } from "@/components/agency-contact";
import { PublicFooter, PublicHeader } from "@/components/public-site-shell";
import { TrackLink } from "@/components/track-link";

const description =
  "Web design, Google Ads, and local SEO for towing and roadside assistance businesses. Build a clear path from local search to a qualified inquiry.";
export const metadata: Metadata = {
  title: "Towing Websites, Google Ads & Local SEO",
  description,
  alternates: { canonical: "/towing-marketing" },
  openGraph: {
    title: "Towing Websites, Google Ads & Local SEO | Orbisy",
    description,
    url: "/towing-marketing",
  },
  twitter: {
    title: "Towing Websites, Google Ads & Local SEO | Orbisy",
    description,
  },
};
const benefits = [
  [
    Globe,
    "Make it easy to call",
    "A mobile-friendly website with clear services, coverage areas, and a visible way to reach your business.",
  ],
  [
    MousePointerClick,
    "Reach relevant searches",
    "Google Ads campaigns organized around the services you provide, the areas you cover, and the jobs you want.",
  ],
  [
    MapPin,
    "Strengthen local visibility",
    "Useful service pages and accurate business information across your website and Google Business Profile.",
  ],
] as const;
const faqs = [
  [
    "Can you help with heavy-duty towing or roadside assistance?",
    "We can scope the website and marketing around your actual services, including light-duty towing, heavy-duty work, recovery, and roadside assistance. We confirm your capabilities and coverage before building the offer.",
  ],
  [
    "Do we need to replace our current website?",
    "Not necessarily. We’ll review your starting point and discuss targeted improvements, a dedicated landing page, or a new website.",
  ],
  [
    "How do you measure progress?",
    "Depending on the scope, measurement can include submitted inquiries, tracked calls, qualified leads, and booked jobs you report. We agree on the measurement and any required tools before launch.",
  ],
  [
    "Does your management fee include ad spend?",
    "No. Advertising spend and any third-party call-tracking costs are separate and will be identified in the proposal.",
  ],
] as const;

export default function TowingMarketingPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="agency-towing">
        <section className="hero agency-hero" id="top">
          <div className="hero-grid" aria-hidden="true" />
          <div className="container hero-layout">
            <div className="hero-copy">
              <p className="eyebrow">
                <span />
                Towing & roadside assistance
              </p>
              <h1>
                Be easier to find.
                <br />
                <span>Be easier to call.</span>
              </h1>
              <p className="hero-lede">
                Websites, Google Ads, and local SEO built around your towing
                services, service area, and the jobs you want to book.
              </p>
              <div className="hero-actions">
                <TrackLink
                  className="button"
                  href="#contact"
                  eventName="primary_cta_click"
                  componentId="towing_project_request"
                >
                  Request a consultation
                </TrackLink>
                <a className="text-link" href="#towing-services">
                  Explore the services
                </a>
              </div>
              <ul className="hero-points">
                <li>Mobile-friendly websites</li>
                <li>Local targeting</li>
                <li>Clear inquiry tracking</li>
              </ul>
            </div>
            <aside
              className="agency-service-panel towing-focus-panel"
              aria-label="Towing marketing priorities"
            >
              <Truck
                className="towing-panel-icon"
                size={42}
                aria-hidden="true"
              />
              <p className="eyebrow">
                <span />
                Start with your operation
              </p>
              <h2>
                The right inquiries
                <br />
                for your business.
              </h2>
              <ul className="towing-priorities">
                <li>
                  <Phone size={20} aria-hidden="true" />
                  <div>
                    <strong>Your services</strong>
                    <p>Promote the jobs your trucks and team can handle.</p>
                  </div>
                </li>
                <li>
                  <MapPin size={20} aria-hidden="true" />
                  <div>
                    <strong>Your coverage</strong>
                    <p>Focus on the areas you actually serve.</p>
                  </div>
                </li>
                <li>
                  <Check size={20} aria-hidden="true" />
                  <div>
                    <strong>Your capacity</strong>
                    <p>
                      Align the offer with your hours and ability to answer
                      calls.
                    </p>
                  </div>
                </li>
              </ul>
            </aside>
          </div>
        </section>
        <section className="section services-section" id="towing-services">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">
                <span />A practical marketing foundation
              </p>
              <h2>
                Connect the search
                <br />
                to the next conversation.
              </h2>
              <p>
                Start with a website, advertising, or local SEO. Combine them
                when it makes sense for your business.
              </p>
            </div>
            <div className="benefit-grid">
              {benefits.map(([Icon, title, text]) => (
                <article className="benefit-card" key={title}>
                  <Icon size={25} aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="section pilot-section">
          <div className="container pilot-layout">
            <div>
              <p className="eyebrow">
                <span />
                Before we build
              </p>
              <h2>
                Understand what
                <br />a good job looks like.
              </h2>
              <p>
                A call is only useful when it fits your business. We’ll talk
                through your service mix, coverage, availability, and current
                marketing before recommending a scope.
              </p>
            </div>
            <ul>
              <li>
                <Check size={17} aria-hidden="true" />
                Which services and job types do you want more of?
              </li>
              <li>
                <Check size={17} aria-hidden="true" />
                Which locations can you serve reliably?
              </li>
              <li>
                <Check size={17} aria-hidden="true" />
                Who answers calls, and during which hours?
              </li>
              <li>
                <Check size={17} aria-hidden="true" />
                What website and advertising accounts already exist?
              </li>
              <li>
                <Check size={17} aria-hidden="true" />
                What budget and measurement fit your goals?
              </li>
            </ul>
          </div>
        </section>
        <section className="section">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Choose a starting engagement</p>
              <h2>
                A website, paid search,
                <br />
                or a stronger local foundation.
              </h2>
            </div>
            <div className="scope-notes">
              <article>
                <h3>Agree on the work</h3>
                <p>
                  Begin with a review of your services, trucks, coverage,
                  operating hours, and existing accounts. A website project
                  includes an agreed page plan, responsive build, and contact
                  flow. Advertising includes campaign setup, a measurement plan,
                  and separately scoped management. Local SEO begins with a
                  review and prioritized improvements.
                </p>
                <p>
                  <Link className="text-link" href="/web-design">
                    Website project details →
                  </Link>
                </p>
                <p>
                  <Link className="text-link" href="/google-ads">
                    Google Ads engagement →
                  </Link>
                </p>
                <p>
                  <Link className="text-link" href="/local-seo">
                    Local SEO engagement →
                  </Link>
                </p>
              </article>
              <article>
                <h3>Your inputs and the pricing</h3>
                <p>
                  Provide accurate service details, real coverage areas,
                  approved photos, account access, and someone who can review
                  inquiries. We agree on deliverables and approval milestones
                  before building. Website projects and initial setup are quoted
                  by scope; ongoing marketing has its own recurring fee. Google
                  advertising spend and third-party subscriptions remain
                  separate.
                </p>
                <p>
                  We review the site or campaign with you before launch, then
                  use the agreed reporting to decide what to improve. No
                  rankings or job volume are guaranteed.
                </p>
              </article>
            </div>
          </div>
        </section>
        <Portfolio />
        <AgencyContact
          title="Request a consultation for your towing business."
          description="Share your services, coverage area, and what you want to improve. Anthony will review the details and follow up about a suitable next step."
        />
        <section className="section faq-section">
          <div className="container faq-layout">
            <div className="section-heading">
              <p className="eyebrow">
                <span />
                Questions, answered
              </p>
              <h2>Before you get started.</h2>
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
