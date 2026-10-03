import {
  ArrowRight,
  CalendarClock,
  Check,
  Files,
  MapPin,
  SearchCheck,
  Store,
} from "lucide-react";
import Image from "next/image";
import { PublicForm } from "@/components/public-form";
import { PublicFooter, PublicHeader } from "@/components/public-site-shell";
import { TrackLink } from "@/components/track-link";

const services = [
  ["service_record_cleanup", Files, "01", "Record cleanup", "We organize existing grease-interceptor tickets, photographs, manifests, and service history by location and asset."],
  ["service_missing_review", SearchCheck, "02", "Missing-record review", "We compare expected service events with the evidence available and identify incomplete, unmatched, or missing records."],
  ["service_upcoming_monitoring", CalendarClock, "03", "Upcoming-service monitoring", "We maintain an agreed calendar and notify your team when service or supporting documentation is approaching or outstanding."],
  ["service_multi_location", Store, "04", "Multi-location visibility", "Restaurant groups receive one organized view of locations, interceptors, service history, gaps, and upcoming work."],
] as const;

const audiences = [
  ["audience_restaurants", "Restaurant operators", "Owners, franchisees, operations teams, and facilities managers responsible for multiple commercial kitchens.", "/restaurants", "For restaurant operators"],
  ["audience_haulers", "Grease haulers", "Service companies that want to provide customers with organized, professional service histories.", "/haulers", "For grease haulers"],
  ["audience_facilities", "Property and facility teams", "Managers overseeing food-service tenants, hotel kitchens, senior-living dining, grocery prepared-food operations, or commissary kitchens.", "#records-review", "Discuss your workflow"],
] as const;

const process = [
  ["Upload", "Send the records currently available."],
  ["Confirm", "Verify locations, known interceptors, haulers, and service schedules."],
  ["Reconcile", "Compare expected service with the available records."],
  ["Resolve", "Identify missing items and perform authorized follow-up."],
  ["Deliver", "Receive an organized history, gap report, and upcoming calendar."],
] as const;

const faqs = [
  ["Does Orbisy replace our grease hauler?", "No. Orbisy organizes records and maintains an independent history across vendors. Your team keeps its current hauler and remains responsible for choosing and managing service providers."],
  ["Does Orbisy guarantee compliance?", "No. Orbisy does not provide legal or regulatory advice, certify compliance, guarantee an inspection result, or guarantee that a municipality will accept a record. Reviews are based on customer-supplied information."],
  ["What records can Orbisy organize?", "Available service tickets, manifests, photographs, invoices, asset details, service schedules, and related supporting evidence can be reconciled when your team is authorized to provide them."],
  ["Is this currently software or a managed service?", "Current pilots are delivered as a managed service through secure folders, spreadsheets, scheduled follow-ups, and polished reports. A customer portal is not part of the current service."],
  ["Can Orbisy support multiple locations?", "Yes. The service is designed to organize locations, known interceptors, vendors, service history, apparent gaps, and upcoming dates in one consistent view."],
  ["What happens during the initial pilot?", "After confirming scope and authorization, Orbisy organizes a defined set of customer-supplied records, reviews apparent gaps, and delivers an agreed history and upcoming calendar. Cleanup work is paid; a client relationship begins only through a written agreement."],
  ["Can grease haulers participate?", "Yes. Haulers can work with Orbisy to improve ticket completeness and deliver organized customer histories without replacing dispatch, routing, billing, or accounting systems. Customer confirmation and authorization are required."],
] as const;

export default function Home() {
  return (
    <>
      <PublicHeader />
      <main id="main-content">
        <section className="hero" id="top">
          <div className="hero-grid" aria-hidden="true" />
          <div className="container hero-layout">
            <div className="hero-copy">
              <p className="eyebrow"><span />Service-record management for commercial kitchens</p>
              <h1>Know what was serviced.<br /><span>Know what is missing.</span></h1>
              <p className="hero-lede">Orbisy organizes grease-interceptor service tickets, supporting evidence, and upcoming dates for restaurant operators—without replacing their current grease hauler.</p>
              <div className="hero-actions">
                <TrackLink className="button" href="#records-review" eventName="primary_cta_click" componentId="hero_records_review">
                  Request a Records Review <ArrowRight size={18} />
                </TrackLink>
                <TrackLink className="text-link" href="/haulers" eventName="secondary_cta_click" componentId="hero_haulers">
                  For Grease Haulers <span aria-hidden="true">↘</span>
                </TrackLink>
              </div>
              <ul className="hero-points" aria-label="Orbisy service benefits">
                <li><Check size={15} /> Independent service history</li>
                <li><Check size={15} /> Missing-record detection</li>
                <li><Check size={15} /> Upcoming-date monitoring</li>
              </ul>
            </div>
            <div className="hero-visual hero-portal-preview">
              <div className="visual-glow" />
              <figure className="hero-concept-frame">
                <div className="hero-concept-image"><Image alt="Planned restaurant portal concept showing locations, record status, open items, and upcoming service" fill priority sizes="(max-width: 980px) 92vw, 46vw" src="/restaurant-portal-overview-concept.webp" /></div>
                <figcaption><strong>Planned software direction</strong><span>Concept preview—not a currently available portal. Current pilots are delivered as a managed service.</span></figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="section services-section" id="services"><div className="container">
          <div className="section-heading split-heading"><div><p className="eyebrow"><span />What Orbisy manages</p><h2>A clear history from the records you already have.</h2></div><p>Orbisy compares expected service with available evidence, identifies apparent documentation gaps, and maintains the upcoming calendar your team agrees to.</p></div>
          <div className="service-grid">{services.map(([id, Icon, number, title, text]) => <article className="service-card" key={title} data-analytics-view={id}><div className="service-meta"><span>{number}</span><Icon size={22} /></div><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div></section>

        <section className="section work-section" id="who-we-help"><div className="container">
          <div className="section-heading"><p className="eyebrow"><span />Who Orbisy helps</p><h2>Records that stay usable as operations change.</h2><p className="section-note">A focused managed service for teams responsible for commercial-kitchen service history.</p></div>
          <div className="concept-grid audience-grid">{audiences.map(([id, title, text, href, label]) => <article className="concept-card audience-card" key={title} data-analytics-view={id}><div className="concept-content"><span className="concept-label">Managed records</span><h3>{title}</h3><p>{text}</p><a className="text-link audience-link" href={href}>{label} <span aria-hidden="true">→</span></a></div></article>)}</div>
        </div></section>

        <section className="section about-section" id="about"><div className="container about-layout about-layout-text">
          <div className="about-copy"><p className="eyebrow"><span />About Orbisy</p><h2>Careful operations now. Purpose-built software later.</h2><p>Orbisy is a Chicago-based operations and software business developing grease-interceptor record management through real, manually delivered workflows. Current pilots use secure folders, spreadsheets, scheduled follow-ups, and polished reports—not a finished software portal.</p><p>The work starts with customer-supplied information, a focused scope, and clear authorization. Orbisy organizes documentation and reports apparent gaps; it does not pump or inspect interceptors, replace a hauler, or certify compliance.</p><div className="about-location"><MapPin size={18} />Chicago, Illinois · Supporting teams locally and remotely</div></div>
        </div></section>

        <section className="section process-section" id="process"><div className="container">
          <div className="section-heading split-heading"><div><p className="eyebrow"><span />How the managed service works</p><h2>From scattered evidence to a retrievable history.</h2></div><p>Scope, schedules, and any follow-up are confirmed with your team before work begins.</p></div>
          <ol className="process-grid process-grid-five">{process.map(([title, text], index) => <li key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
        </div></section>

        <section className="section review-section" id="records-review"><div className="container review-layout">
          <div className="form-intro"><p className="eyebrow"><span />A useful first step</p><h2>Request a Grease-Record Review.</h2><p>Tell us how your team currently stores grease-interceptor service records. Orbisy will review the workflow, identify where records may be difficult to retrieve, and determine whether a small paid cleanup pilot would be useful.</p><ul><li><Check size={17} /> Short workflow review or discovery conversation</li><li><Check size={17} /> No free records cleanup</li><li><Check size={17} /> Written agreement before client work begins</li></ul><small>This review is informational and based on the details you provide. It is not legal advice, regulatory certification, or a compliance guarantee.</small></div>
          <PublicForm type="project-request" />
        </div></section>

        <section className="section faq-section" id="faq"><div className="container faq-layout"><div className="section-heading"><p className="eyebrow"><span />Questions, answered</p><h2>What to expect.</h2></div><div className="faq-list">{faqs.map(([question, answer], index) => <details key={question} data-faq-index={index}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div></section>
      </main>
      <PublicFooter />
    </>
  );
}
