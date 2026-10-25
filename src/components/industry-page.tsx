import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { PublicHeader, PublicFooter } from "@/components/public-site-shell";
import { AgencyContact } from "@/components/agency-contact";
import type { Industry } from "@/lib/industries";
export function IndustryPage({ industry: i }: { industry: Industry }) {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="industry-page">
        <section className="section industry-hero">
          <div className="container industry-hero-layout">
            <div>
              <Link className="industry-back" href="/industries">
                Industries / {i.name}
              </Link>
              <p className="eyebrow">
                <span />
                Websites, marketing & follow-up
              </p>
              <h1>{i.headline}</h1>
              <p className="hero-lede">{i.intro}</p>
              <a className="button" href="#contact">
                Request a consultation{" "}
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            </div>
            <aside className="industry-brief">
              <p className="eyebrow">Built around your work</p>
              <h2>{i.name}</h2>
              <p>{i.focus}</p>
              <ul>
                <li>
                  <Check size={16} aria-hidden="true" />
                  Your real services and service area
                </li>
                <li>
                  <Check size={16} aria-hidden="true" />A useful path from
                  inquiry to conversation
                </li>
                <li>
                  <Check size={16} aria-hidden="true" />
                  Clear scopes and separate advertising budgets
                </li>
              </ul>
              <Link href="/pricing" className="text-link">
                View pricing & packages →
              </Link>
            </aside>
          </div>
        </section>
        <section className="section industry-priorities">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">
                <span />
                What the website needs to do
              </p>
              <h2>
                Useful for the customer.
                <br />
                Practical for your team.
              </h2>
            </div>
            <div className="industry-priority-grid">
              {i.priorities.map(([title, text], index) => (
                <article key={title}>
                  <span>0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="section">
          <div className="container scope-layout">
            <div>
              <p className="eyebrow">A connected inquiry process</p>
              <h2>
                Plan the follow-up
                <br />
                alongside the first click.
              </h2>
              <p>
                These are workflow examples to scope together, not a
                preconfigured system or a promise of booked work. We review your
                tools, permissions, and handoff process before implementation.
              </p>
              <Link href="/automated-follow-up" className="text-link">
                Explore automated lead follow-up →
              </Link>
            </div>
            <div>
              <ul className="industry-workflows">
                {i.workflow.map((step, index) => (
                  <li key={step}>
                    <span>0{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ul>
              <p className="industry-footnote">
                Customer replies, bookings, closed requests, and opt-outs need
                appropriate stop conditions. SMS requires suitable consent and
                provider setup.
              </p>
            </div>
          </div>
        </section>
        <section className="section industry-services">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">
                <span />
                Choose the work you need
              </p>
              <h2>
                A website first.
                <br />
                Or a more connected setup.
              </h2>
            </div>
            <div className="industry-service-grid">
              {[
                [
                  "/web-design",
                  "Website projects",
                  "Service pages, useful imagery, and a clear inquiry path.",
                ],
                [
                  "/google-ads",
                  "Google Ads",
                  "A focused campaign and relevant landing page; ad spend separate.",
                ],
                [
                  "/local-seo",
                  "Local SEO",
                  "Accurate business information and useful local service content.",
                ],
                [
                  "/custom-development",
                  "Custom software & integrations",
                  "Booking connections, internal tools, and workflows scoped around your systems.",
                ],
                [
                  "/website-maintenance",
                  "Website care & updates",
                  "Keep approved content, hours, menus, and service details current within an agreed allowance.",
                ],
                [
                  "/automated-follow-up",
                  "Automated follow-up",
                  "Agreed acknowledgments, owner alerts, and human handoffs.",
                ],
              ].map(([href, title, text]) => (
                <Link href={href} key={href}>
                  <h3>
                    {title}
                    <ArrowUpRight size={19} aria-hidden="true" />
                  </h3>
                  <p>{text}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section className="section">
          <div className="container scope-layout">
            <div>
              <p className="eyebrow">Before the work begins</p>
              <h2>
                Your business details
                <br />
                shape the scope.
              </h2>
              <p>{i.requirements}</p>
            </div>
            <div className="industry-evidence">
              <p className="eyebrow">Work you can inspect</p>
              <h3>
                {i.evidence
                  ? "Explore our automotive-related website work."
                  : "See how Orbisy approaches a website."}
              </h3>
              <p>
                {i.evidence
                  ? "Rescue Battery Shop and Rescue Tow Truck show real website implementations. We do not present them as documented advertising results."
                  : "Our current live portfolio features towing and mobile battery businesses. Those examples show our implementation approach; they are not case studies or results for this industry."}
              </p>
              <Link href="/work" className="text-link">
                Explore Orbisy’s portfolio →
              </Link>
              <Link href="/pricing" className="text-link">
                Compare packages and scope →
              </Link>
            </div>
          </div>
        </section>
        <section className="section faq-section">
          <div className="container faq-layout">
            <div className="section-heading">
              <p className="eyebrow">
                Questions for {i.shortName.toLowerCase()} businesses
              </p>
              <h2>Before you decide.</h2>
            </div>
            <div className="faq-list">
              {i.faq.map(([q, a]) => (
                <details key={q}>
                  <summary>
                    {q}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <AgencyContact
          inquiryContext={`Industry: ${i.name}.`}
          description={`Tell us about your ${i.shortName.toLowerCase()} business, your service area, and what you want to improve. Orbisy will review your goals and help define a suitable next step.`}
        />
      </main>
      <PublicFooter />
    </>
  );
}
