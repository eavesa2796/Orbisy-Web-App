import Link from "next/link";
import { AgencyContact } from "@/components/agency-contact";
import { PublicFooter, PublicHeader } from "@/components/public-site-shell";
import { engagements, type Engagement } from "@/lib/engagements";
export function EngagementPage({ engagement: e }: { engagement: Engagement }) {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="engagement-page">
        <section className="section service-hero">
          <div className="container">
            <p className="eyebrow">
              <span />
              {e.eyebrow}
            </p>
            <h1>{e.headline}</h1>
            <p className="hero-lede">{e.description}</p>
            <a className="button" href="#contact">
              Request a consultation
            </a>
            <p className="service-fit">{e.fit}</p>
          </div>
        </section>
        <section className="section scope-section">
          <div className="container scope-layout">
            <div>
              <p className="eyebrow">{e.title}</p>
              <h2>Know what you’re buying.</h2>
              <p>
                Every engagement begins with a written scope. These are the
                starting deliverables; your proposal defines exactly what is
                included.
              </p>
              <Link className="text-link" href="/work">
                Explore Anthony’s website work →
              </Link>
            </div>
            <ul className="scope-deliverables">
              {e.deliverables.map((d, i) => (
                <li key={d}>
                  <span>0{i + 1}</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section className="section">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Getting started</p>
              <h2>
                From first conversation
                <br />
                to an agreed plan.
              </h2>
            </div>
            <ol className="process-grid engagement-steps">
              {e.onboarding.map((s, i) => (
                <li key={s}>
                  <span>0{i + 1}</span>
                  <h3>{["Understand", "Scope", "Review & begin"][i]}</h3>
                  <p>{s}</p>
                </li>
              ))}
            </ol>
            <div className="scope-notes">
              <article>
                <h3>What we need from you</h3>
                <p>{e.responsibilities}</p>
              </article>
              <article>
                <h3>How pricing works</h3>
                <p>{e.pricing}</p>
              </article>
            </div>
          </div>
        </section>
        <section className="section faq-section">
          <div className="container faq-layout">
            <div>
              <p className="eyebrow">Before you decide</p>
              <h2>A few practical questions.</h2>
            </div>
            <div className="faq-list">
              {e.faq.map(([q, a], i) => (
                <details key={q} data-faq-index={i}>
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
        <AgencyContact service={e.service} />
        <section className="related-services container">
          <h2>Other ways to work with Orbisy</h2>
          {engagements
            .filter((other) => other.slug !== e.slug)
            .map((other) => (
              <Link key={other.slug} href={`/${other.slug}`}>
                {other.shortTitle} →
              </Link>
            ))}
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
