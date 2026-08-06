import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import { PublicForm } from "@/components/public-form";
import { PublicFooter, PublicHeader } from "@/components/public-site-shell";
import { TrackLink } from "@/components/track-link";

type LandingPageProps = {
  eyebrow: string;
  title: string;
  lede: string;
  benefits: readonly { title: string; text: string }[];
  pilotTitle: string;
  pilotText: string;
  pilotItems: readonly string[];
  conceptImages: readonly {
    src: string;
    alt: string;
    orientation: "wide" | "tall";
  }[];
};

export function AudienceLandingPage({
  eyebrow,
  title,
  lede,
  benefits,
  pilotTitle,
  pilotText,
  pilotItems,
  conceptImages,
}: LandingPageProps) {
  return (
    <>
      <PublicHeader />
      <main id="main-content">
        <section className="audience-hero" id="top">
          <div className="hero-grid" aria-hidden="true" />
          <div className="container audience-hero-copy">
            <p className="eyebrow"><span />{eyebrow}</p>
            <h1>{title}</h1>
            <p className="hero-lede">{lede}</p>
            <TrackLink className="button" href="#records-review" eventName="primary_cta_click" componentId="audience_records_review">
              Request a Records Review <ArrowRight size={18} />
            </TrackLink>
          </div>
        </section>

        <section className="section"><div className="container">
          <div className="section-heading"><p className="eyebrow"><span />Why organized records matter</p><h2>Keep service history useful through everyday change.</h2></div>
          <div className="benefit-grid">{benefits.map((benefit) => <article className="benefit-card" key={benefit.title}><Check size={19} /><h3>{benefit.title}</h3><p>{benefit.text}</p></article>)}</div>
        </div></section>

        <section className="section concept-direction-section"><div className="container">
          <div className="section-heading split-heading">
            <div><p className="eyebrow"><span />Planned software direction</p><h2>A preview of where the managed workflow could lead.</h2></div>
            <p>These images are concept designs, not a working customer portal. Current pilots are delivered as a managed service through secure folders, spreadsheets, scheduled follow-ups, and reports.</p>
          </div>
          <div className="portal-concept-grid">
            {conceptImages.map((image) => (
              <figure className={`portal-concept portal-concept-${image.orientation}`} key={image.src}>
                <Image alt={image.alt} fill sizes={image.orientation === "wide" ? "(max-width: 980px) 100vw, 72vw" : "(max-width: 680px) 88vw, 28vw"} src={image.src} />
                <figcaption>Concept preview—planned software direction, not a currently available portal.</figcaption>
              </figure>
            ))}
          </div>
        </div></section>

        <section className="section pilot-section"><div className="container pilot-layout">
          <div><p className="eyebrow"><span />Paid pilot</p><h2>{pilotTitle}</h2><p>{pilotText}</p></div>
          <ul>{pilotItems.map((item) => <li key={item}><Check size={17} />{item}</li>)}</ul>
        </div></section>

        <section className="section review-section" id="records-review"><div className="container review-layout">
          <div className="form-intro"><p className="eyebrow"><span />Start with the workflow</p><h2>Request a short records-workflow review.</h2><p>Share the current process and the records challenge your team is trying to solve. Orbisy will determine whether a focused paid pilot may be useful.</p><small>The conversation is not a free cleanup or compliance review. A client relationship and any authorized follow-up begin only through a written agreement.</small></div>
          <PublicForm type="project-request" />
        </div></section>
      </main>
      <PublicFooter />
    </>
  );
}
