import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Globe2, TrendingUp, Workflow } from "lucide-react";
import { AgencyContact } from "@/components/agency-contact";
import { PublicFooter, PublicHeader } from "@/components/public-site-shell";
import {
  findPublicPackage,
  pricingAddOns,
  publicPackages,
  supportingOffers,
  subscriptionPlans,
} from "@/lib/public-pricing";
import "./pricing.css";

export const metadata: Metadata = {
  title: "Pricing & Packages",
  description:
    "Compare Starter at $299/month, Growth at $999/month, and Complete at $2,499/month, plus one-time website projects and individual services. Onboarding and ad spend separate.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing & Packages | Orbisy",
    description:
      "Monthly website, marketing, and custom software support with defined scope. Starter, Growth, and Complete plans, plus individual projects.",
    url: "/pricing",
  },
};

const faqs = [
  [
    "Does a monthly plan include a new website build?",
    "The monthly prices cover ongoing support for the agreed scope. A new website, initial campaign or workflow setup, major remediation, and onboarding are quoted separately. We review your existing site and tools first and itemize these costs before you commit.",
  ],
  [
    "Does Complete mean unlimited work?",
    "Complete gives you access to every service category with defined capacity. It includes four hours of custom development each month through one prioritized request queue, alongside the listed Growth services. Additional website, landing-page, SEO, workflow, and integration work needs an agreed monthly scope. Large applications and work beyond that capacity are quoted separately.",
  ],
  [
    "How are monthly hours, scheduling, and cancellation handled?",
    "Your written proposal confirms the work queue, monthly deliverables, how time is recorded, any unused-time or rollover rules, billing start date, initial term if applicable, cancellation, ownership, and handover. Priority scheduling is not a 24/7 support or guaranteed response-time commitment. We agree on these details before a subscription starts.",
  ],
  [
    "Are these prices in US dollars?",
    "Yes. All listed amounts are in USD. The prices cover the scope described here. Your written proposal confirms applicable taxes, payment schedule, deliverables, and any agreed extras before paid work begins.",
  ],
  [
    "Is Google advertising spend included?",
    "No. Your advertising budget is additional and paid directly to Google from your own account. Growth and Complete include the listed Google Ads management scope in their monthly fee; do not add the standalone management fee again. Standalone Google Ads is $750 setup plus $500/month management. Plan onboarding and campaign setup are quoted separately before work begins.",
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
    "All three monthly plans include the listed website care. Hosting, domain registration, paid licenses, messaging usage, and third-party subscriptions are separate unless your proposal specifically includes them. Standalone Website Care remains available for a smaller support scope.",
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
    "Do the plans work for restaurants and other local businesses?",
    "Yes. We work with restaurants, home services, towing, and other local businesses. Towing and roadside assistance remain a specialty. We review existing websites before recommending improvements or a rebuild. Neither SEO nor advertising includes a ranking, lead-volume, or revenue guarantee.",
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
                One partner.
                <br />
                <span>A plan that fits your business.</span>
              </h1>
              <p className="hero-lede">
                Ongoing website, marketing, and custom software support for
                restaurants and local businesses. Choose Starter, Growth, or
                Complete—or begin with a one-time project.
              </p>
              <div className="hero-actions">
                <a className="button" href="#monthly-plans">
                  Compare monthly plans <ArrowRight size={18} aria-hidden="true" />
                </a>
                <a className="text-link" href="#packages">
                  One-time projects & individual services →
                </a>
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
        <section className="section pricing-subscriptions" id="monthly-plans" aria-labelledby="monthly-plans-heading">
          <div className="container">
            <div className="section-heading split-heading">
              <div>
                <p className="eyebrow"><span />Ongoing partnership</p>
                <h2 id="monthly-plans-heading">Start with the essentials.<br />Build toward a connected business.</h2>
              </div>
              <p>Three monthly plans. A clear scope for each. Initial builds and onboarding are quoted separately, and advertising spend is always additional.</p>
            </div>
            <div className="pricing-package-grid subscription-plan-grid">
              {subscriptionPlans.map((plan) => {
                const Icon = { starter: Globe2, growth: TrendingUp, complete: Workflow }[plan.id];
                return (
                  <article key={plan.id} className={`pricing-package subscription-plan${plan.featured ? " pricing-package-featured" : ""}${plan.id === "complete" ? " subscription-complete" : ""}`} aria-labelledby={`${plan.id}-heading`}>
                    <div className="pricing-package-top">
                      <span className="subscription-icon"><Icon size={27} strokeWidth={1.5} aria-hidden="true" /></span>
                      <span className="pricing-recommendation">{plan.id === "starter" ? "The essentials" : plan.id === "growth" ? "For ongoing marketing" : "Every service category"}</span>
                    </div>
                    <h3 id={`${plan.id}-heading`}>{plan.name}</h3>
                    <p className="pricing-fit">{plan.fit}</p>
                    <div className="pricing-amount"><strong>{plan.price}</strong><span>{plan.billing}</span></div>
                    <p className="pricing-setup">Onboarding quoted separately · USD</p>
                    <p className="pricing-description">{plan.description}</p>
                    <ul className="pricing-features">{plan.features.map((feature) => <li key={feature}><Check size={17} aria-hidden="true" /><span>{feature}</span></li>)}</ul>
                    <p className="pricing-scope">{plan.scope}</p>
                    <a className="button pricing-package-cta" href={`/pricing?package=${plan.id}#contact`} aria-label={`Request a consultation about ${plan.name}`}>
                      Explore {plan.name}<ArrowRight size={17} aria-hidden="true" />
                    </a>
                  </article>
                );
              })}
            </div>
            <div className="subscription-boundaries">
              <div><h3>Start with the right foundation.</h3><p>We review your site, accounts, tools, and content. New builds, campaign or workflow setup, and onboarding receive a separate written quote.</p></div>
              <div><h3>Know what the monthly fee covers.</h3><p>One business website; Growth and Complete cover one Ads account, one local market, and one business location. Extra locations, tools, messaging usage, and ad spend are separate unless explicitly included.</p></div>
              <div><h3>Agree on the work before it starts.</h3><p>Your proposal confirms monthly capacity, priorities, unused-time rules, scheduling, cancellation, and ownership. Requesting a consultation does not start a subscription or charge a payment.</p></div>
            </div>
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
                One-time projects & individual services
              </p>
              <h2 id="packages-heading">
                A focused page.
                <br />A complete site. A search campaign.
              </h2>
              <p>
                Prefer a specific project or a standalone service? These offers
                remain available alongside the monthly plans. Each price covers
                the listed scope, with extras itemized in your proposal.
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
                  <a
                    className="button pricing-package-cta"
                    href={`/pricing?package=${offer.id}#contact`}
                   
                    aria-label={`Request a consultation about ${offer.name}`}
                  >
                    Request a consultation{" "}
                    <ArrowRight size={17} aria-hidden="true" />
                  </a>
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
              <strong>Standalone Google Ads</strong>
              <p>
                For the standalone service, the first month’s Orbisy fees are $1,250 ($750 setup + $500
                management), plus your separate Google advertising budget and
                any agreed extras. Ongoing management is $500/month for the
                listed scope. Growth and Complete already include their listed
                management scope; the standalone management fee is not added to those plans.
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
                    <a
                      className="text-link"
                      href={`/pricing?package=${offer.id}#contact`}
                     
                      aria-label={`Request a consultation about ${offer.name}`}
                    >
                      Request a consultation →
                    </a>
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
