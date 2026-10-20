import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { AgencyContact } from "@/components/agency-contact";
import { PublicFooter, PublicHeader } from "@/components/public-site-shell";
import {
  findPublicPackage,
  pricingAddOns,
  publicPackages,
  supportingOffers,
} from "@/lib/public-pricing";
import "./pricing.css";

export const metadata: Metadata = {
  title: "Pricing & Packages",
  description:
    "Explore Orbisy website packages, Google Ads management, local SEO setup, website care, and custom development. Clear scope, fees, and next steps.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing & Packages | Orbisy",
    description:
      "Choose a clear starting point for your website and marketing.",
    url: "/pricing",
  },
};

const faqs = [
  [
    "Are these prices in US dollars?",
    "Yes. All listed amounts are in USD. The prices cover the scope described here. Your written proposal confirms applicable taxes, payment schedule, deliverables, and any agreed extras before paid work begins.",
  ],
  [
    "Is Google advertising spend included?",
    "No. Google Ads costs $750 for setup and $500 per month for the management scope listed above. Your advertising budget is additional and paid directly to Google from your own account. Landing pages and third-party tools are separate. Any change to management scope is agreed before additional work.",
  ],
  [
    "What do I need to provide for a website?",
    "Provide approved service details and copy, your logo, images you have rights to use, required account access, and consolidated feedback. We organize your supplied content. Full copywriting and photography are not included in the website packages.",
  ],
  [
    "What counts as a revision round?",
    "One round is one consolidated set of feedback on the agreed design or website. The website packages include two rounds. Extra pages, new functionality, a changed brief, and additional rounds are quoted before the work is added.",
  ],
  [
    "Are hosting and maintenance included?",
    "Hosting, domain registration, paid licenses, and third-party subscriptions are separate unless your proposal specifically includes them. Website Care is optional and covers the monthly scope shown above.",
  ],
  [
    "How long does the work take?",
    "We confirm a schedule after reviewing the scope, existing site, content readiness, and required access. Delivery depends on receiving your materials, feedback, and approvals.",
  ],
  [
    "How do payments and ongoing services work?",
    "Your proposal sets out the payment schedule, any deposit, billing start date, and terms for ongoing work, cancellation, ownership, and handover. Requesting a consultation does not start a subscription or commit you to paid work.",
  ],
  [
    "Can you help a towing business or improve an existing site?",
    "Yes. Towing and roadside assistance are a specialty, and we also work with other local service businesses. We review existing websites before recommending improvements or a rebuild. Neither SEO nor advertising includes a ranking, lead-volume, or revenue guarantee.",
  ],
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ package?: string | string[] }>;
}) {
  const selected = findPublicPackage((await searchParams).package);
  const context = selected
    ? `Requested package: ${selected.name} (${selected.priceSummary}).`
    : undefined;
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="pricing-page">
        <section className="section pricing-hero">
          <div className="container pricing-hero-layout">
            <div>
              <p className="eyebrow">
                <span />
                Pricing & packages
              </p>
              <h1>
                Clear scope.
                <br />
                <span>A practical starting point.</span>
              </h1>
              <p className="hero-lede">
                Websites, marketing, and software for local service businesses.
                Choose the work you need now, with room to build on it later.
              </p>
              <div className="hero-actions">
                <a className="button" href="#packages">
                  Explore packages <ArrowRight size={18} aria-hidden="true" />
                </a>
                <Link className="text-link" href="/work">
                  See Orbisy’s work →
                </Link>
              </div>
            </div>
            <aside
              className="pricing-intro-note"
              aria-label="How pricing works"
            >
              <span className="pricing-note-number">01 — YOUR NEXT STEP</span>
              <h2>Start with a conversation.</h2>
              <p>
                We review your goals, confirm that the package fits, and agree
                on a written scope before work begins.
              </p>
              <ul>
                <li>
                  <Check size={17} aria-hidden="true" />
                  Published prices in USD
                </li>
                <li>
                  <Check size={17} aria-hidden="true" />
                  Extras agreed in advance
                </li>
                <li>
                  <Check size={17} aria-hidden="true" />
                  Ad spend always separate
                </li>
              </ul>
            </aside>
          </div>
        </section>
        <section
          className="section pricing-packages"
          id="packages"
          aria-labelledby="packages-heading"
        >
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">
                <span />
                Choose your starting point
              </p>
              <h2 id="packages-heading">
                A focused page.
                <br />A complete site. A search campaign.
              </h2>
              <p>
                Each price covers the scope below. We confirm the fit and
                itemize any additional work in your proposal.
              </p>
            </div>
            <div className="pricing-package-grid">
              {publicPackages.map((offer, index) => (
                <article
                  key={offer.id}
                  className={`pricing-package${offer.featured ? " pricing-package-featured" : ""}`}
                  aria-labelledby={`${offer.id}-heading`}
                >
                  <div className="pricing-package-top">
                    <span>0{index + 1}</span>
                    {offer.featured && (
                      <span className="pricing-recommendation">
                        For a complete website
                      </span>
                    )}
                  </div>
                  <h3 id={`${offer.id}-heading`}>{offer.name}</h3>
                  <p className="pricing-fit">{offer.fit}</p>
                  <div className="pricing-amount">
                    <strong>{offer.price}</strong>
                    <span>{offer.billing}</span>
                  </div>
                  <p className="pricing-setup">
                    {"setup" in offer
                      ? offer.setup
                      : "Project price for the scope below"}
                  </p>
                  <p className="pricing-description">{offer.description}</p>
                  <ul className="pricing-features">
                    {offer.features.map((feature) => (
                      <li key={feature}>
                        <Check size={17} aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="pricing-scope">{offer.scope}</p>
                  <Link
                    className="button pricing-package-cta"
                    href={`/pricing?package=${offer.id}#contact`}
                    prefetch={false}
                    aria-label={`Request a consultation about ${offer.name}`}
                  >
                    Request a consultation{" "}
                    <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                  <Link
                    className="text-link pricing-details"
                    href={offer.detailHref}
                  >
                    Explore the service →
                  </Link>
                </article>
              ))}
            </div>
            <div className="pricing-ad-note">
              <strong>Planning for Google Ads?</strong>
              <p>
                The first month’s Orbisy fees are $1,250 ($750 setup + $500
                management), plus your separate Google advertising budget and
                any agreed extras. Ongoing management is $500/month for the
                listed scope.
              </p>
            </div>
          </div>
        </section>
        <section
          className="section pricing-support"
          aria-labelledby="support-heading"
        >
          <div className="container">
            <div className="section-heading split-heading">
              <div>
                <p className="eyebrow">
                  <span />
                  Build on your foundation
                </p>
                <h2 id="support-heading">
                  Local visibility.
                  <br />
                  Ongoing care. Custom tools.
                </h2>
              </div>
              <p>
                Start with a defined improvement, keep your website maintained,
                or discuss software built around your workflow.
              </p>
            </div>
            <div className="pricing-support-list">
              {supportingOffers.map((offer) => (
                <article key={offer.id} className="pricing-support-row">
                  <div>
                    <h3>{offer.name}</h3>
                    <p>{offer.description}</p>
                    <Link className="text-link" href={offer.detailHref}>
                      Explore the service →
                    </Link>
                  </div>
                  <div>
                    <ul className="pricing-features">
                      {offer.features.map((feature) => (
                        <li key={feature}>
                          <Check size={16} aria-hidden="true" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="pricing-scope">{offer.scope}</p>
                  </div>
                  <div className="pricing-support-price">
                    <strong>{offer.price}</strong>
                    <span>{offer.billing}</span>
                    <Link
                      className="text-link"
                      href={`/pricing?package=${offer.id}#contact`}
                      prefetch={false}
                      aria-label={`Request a consultation about ${offer.name}`}
                    >
                      Request a consultation →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section
          className="section pricing-extras"
          aria-labelledby="extras-heading"
        >
          <div className="container pricing-extras-layout">
            <div>
              <p className="eyebrow">
                <span />
                Optional deliverables
              </p>
              <h2 id="extras-heading">
                Add what you need.
                <br />
                Agree on it first.
              </h2>
              <p>
                Add-ons are quoted separately based on the work involved. We
                itemize the price before adding them to your scope.
              </p>
            </div>
            <dl>
              {pricingAddOns.map(([name, description]) => (
                <div key={name}>
                  <dt>
                    {name}
                    <span>Quoted separately</span>
                  </dt>
                  <dd>{description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        <section className="section pricing-next-steps">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">
                <span />
                How we get started
              </p>
              <h2>
                Choose the work.
                <br />
                Then make a plan.
              </h2>
            </div>
            <ol className="pricing-steps">
              <li>
                <span>01</span>
                <h3>Tell us about your business</h3>
                <p>
                  Choose a package or share what you want to improve. Budget and
                  timeline are optional.
                </p>
              </li>
              <li>
                <span>02</span>
                <h3>Confirm the right scope</h3>
                <p>
                  Orbisy replies by email to arrange a conversation and reviews
                  your needs, content, and access.
                </p>
              </li>
              <li>
                <span>03</span>
                <h3>Review your proposal</h3>
                <p>
                  Agree on deliverables, fees, payment terms, and a schedule
                  before paid work begins.
                </p>
              </li>
            </ol>
          </div>
        </section>
        <section className="section faq-section">
          <div className="container faq-layout">
            <div className="section-heading">
              <p className="eyebrow">
                <span />
                Before you decide
              </p>
              <h2>Know what’s included.</h2>
            </div>
            <div className="faq-list">
              {faqs.map(([question, answer]) => (
                <details key={question}>
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
        <AgencyContact
          key={selected?.id ?? "pricing-general"}
          service={selected?.service}
          inquiryContext={context}
          description={
            selected
              ? `Interested in ${selected.name}? Tell us about your business and goals. Orbisy will review the fit and confirm your scope before work begins.`
              : "Not sure which package fits? Tell us about your business and what you want to improve. Orbisy will help you choose a suitable next step."
          }
        />
      </main>
      <PublicFooter />
    </>
  );
}
