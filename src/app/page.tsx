import {
  ArrowRight,
  Braces,
  Check,
  Code2,
  Gauge,
  Layers3,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { OrbisyLogo } from "@/components/orbisy-logo";
import { PublicForm } from "@/components/public-form";
import { TrackLink } from "@/components/track-link";

const services = [
  ["service_websites", Code2, "01", "Small-business websites", "Focused, responsive websites that make your services clear and give potential customers an obvious next step."],
  ["service_refresh", Gauge, "02", "Website improvements", "Practical refreshes for sites that need stronger mobile behavior, clearer content, or a more useful contact path."],
  ["service_tools", Layers3, "03", "Dashboards and internal tools", "Lightweight tools that organize information, reduce repetitive work, and make everyday operations easier to follow."],
  ["service_automation", Braces, "04", "Integrations and automation", "Straightforward connections between the software you already use, designed around a real workflow—not novelty."],
] as const;

const concepts = [
  ["concept_construction", "Construction Project Dashboard", "A calm operations view for schedules, documents, project status, and client updates.", "concept-construction", ["Dashboard", "Operations", "Responsive UI"]],
  ["concept_insurance", "Independent Agency Website", "A service-led website concept with clear coverage paths and a simpler quote request.", "concept-insurance", ["Website refresh", "Lead path", "Mobile"]],
  ["concept_agency", "Boutique Agency Workflow Hub", "A shared workspace concept for requests, approvals, deliverables, and client visibility.", "concept-agency", ["Internal tool", "Workflow", "Approvals"]],
] as const;

const process = [
  ["Understand", "We start with the business goal, the people using the solution, and what is getting in their way."],
  ["Shape", "I narrow the work into a practical scope with clear priorities, limitations, and next steps."],
  ["Build", "The solution is implemented in small, reviewable stages with responsive and accessible behavior."],
  ["Refine", "We verify the core experience, address feedback, and document what comes next."],
] as const;

const faqs = [
  ["What kinds of projects are a good fit?", "Focused small-business websites, thoughtful website refreshes, lightweight dashboards, API connections, and workflow improvements are the best fit for Orbisy right now."],
  ["Do you work with businesses outside Chicago?", "Orbisy is based in Chicago and initially focused on the Chicago metro area, but remote projects can still be considered when the scope is a good match."],
  ["What happens in a free homepage review?", "I review the public homepage for a few clear, objective opportunities—such as mobile usability, clarity, performance, or the contact path—and send back a concise response. It is not a security, SEO, or legal-compliance audit."],
  ["Can you guarantee more leads or revenue?", "No. A better experience may remove friction and make it easier for people to understand or contact a business, but Orbisy does not promise rankings, leads, revenue, or other business outcomes."],
] as const;

export default function Home() {
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <a className="public-brand" href="#top" aria-label="Orbisy home">
            <OrbisyLogo className="public-brand-logo" priority />
          </a>
          <nav aria-label="Public navigation">
            <a href="#services">Services</a>
            <a href="#work">Work</a>
            <a href="#about">About</a>
            <a href="#process">Process</a>
          </nav>
          <TrackLink className="button button-small" href="#homepage-review" eventName="primary_cta_click" componentId="nav_review">
            Free homepage review
          </TrackLink>
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="top">
          <div className="hero-grid" aria-hidden="true" />
          <div className="container hero-layout">
            <div className="hero-copy">
              <p className="eyebrow"><span />Chicago-based software development</p>
              <h1>Modern websites.<br /><span>Useful business tools.</span></h1>
              <p className="hero-lede">
                Orbisy builds focused digital experiences for growing companies
                that want clearer customer journeys and smoother internal work.
              </p>
              <div className="hero-actions">
                <TrackLink className="button" href="#homepage-review" eventName="primary_cta_click" componentId="hero_primary">
                  Get a free homepage review <ArrowRight size={18} />
                </TrackLink>
                <TrackLink className="text-link" href="#work" eventName="secondary_cta_click" componentId="hero_secondary">
                  View my work <span aria-hidden="true">↘</span>
                </TrackLink>
              </div>
              <ul className="hero-points" aria-label="Orbisy approach">
                <li><Check size={15} /> Clear scopes</li>
                <li><Check size={15} /> Responsive by default</li>
                <li><Check size={15} /> Built around real workflows</li>
              </ul>
            </div>

            <div className="hero-visual" aria-label="Orbisy interface concept">
              <div className="visual-glow" />
              <div className="dashboard-card">
                <div className="dashboard-top">
                  <div><span className="mini-label">PROJECT OVERVIEW</span><strong>One useful view</strong></div>
                  <span className="live-pill">Focused</span>
                </div>
                <div className="metric-row">
                  <div><span>01</span><strong>Clear goal</strong></div>
                  <div><span>02</span><strong>Simple path</strong></div>
                  <div><span>03</span><strong>Measured result</strong></div>
                </div>
                <div className="chart-shell">
                  <div className="chart-copy"><span>Customer journey</span><strong>Less friction, more clarity</strong></div>
                  <div className="chart-bars">
                    {[38, 56, 47, 72, 64, 88, 78, 94].map((height, index) => (
                      <span key={height + index} style={{ height: `${height}%` }} />
                    ))}
                  </div>
                </div>
                <div className="activity-list">
                  <div><Sparkles size={16} /><span>Homepage goal clarified</span><em>Ready</em></div>
                  <div><Gauge size={16} /><span>Mobile path simplified</span><em>Next</em></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section services-section" id="services">
          <div className="container">
            <div className="section-heading split-heading">
              <div><p className="eyebrow"><span />What I build</p><h2>Practical software for the next stage of your business.</h2></div>
              <p>No oversized transformation pitch. Just a clear problem, a useful scope, and software designed to earn its place.</p>
            </div>
            <div className="service-grid">
              {services.map(([id, Icon, number, title, text]) => (
                <article className="service-card" key={title} data-analytics-view={id}>
                  <div className="service-meta"><span>{number}</span><Icon size={22} /></div>
                  <h3>{title}</h3><p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section work-section" id="work">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow"><span />Example directions</p>
              <h2>Concepts built around real business needs.</h2>
              <p className="section-note">These are clearly labeled sample concepts—not client work or claims of completed engagements.</p>
            </div>
            <div className="concept-grid">
              {concepts.map(([id, title, text, className, tags]) => (
                <article className="concept-card" key={title} data-analytics-view={id}>
                  <div className={`concept-visual ${className}`} aria-hidden="true">
                    <span className="concept-window-bar" /><div className="concept-window"><span /><span /><span /></div>
                  </div>
                  <div className="concept-content">
                    <span className="concept-label">Concept Project</span>
                    <h3>{title}</h3><p>{text}</p>
                    <ul>{tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section about-section" id="about">
          <div className="container about-layout">
            <figure className="about-portrait">
              <div className="about-image-frame">
                <Image
                  alt="Anthony Eaves, the developer behind Orbisy"
                  fill
                  sizes="(max-width: 980px) 280px, 360px"
                  src="/anthony-eaves.jpg"
                />
              </div>
              <figcaption>The developer behind Orbisy</figcaption>
            </figure>
            <div className="about-copy">
              <p className="eyebrow"><span />About Orbisy</p>
              <h2>Practical software, built around how businesses work.</h2>
              <p>Orbisy helps growing businesses improve outdated websites and replace repetitive work with practical digital tools. The focus is straightforward: modern websites, useful internal dashboards, API integrations, and workflow improvements designed around how each business actually operates.</p>
              <p>Every project begins with understanding the problem, defining a focused scope, and building a maintainable solution without unnecessary complexity. Orbisy is based in Chicago and serves businesses locally and remotely when the project is a good fit.</p>
              <div className="about-location"><MapPin size={18} />Chicago, Illinois · Serving the Chicago metro area</div>
            </div>
          </div>
        </section>

        <section className="section process-section" id="process">
          <div className="container">
            <div className="section-heading split-heading">
              <div><p className="eyebrow"><span />How projects move</p><h2>A simple process with room to think.</h2></div>
              <p>Each step reduces uncertainty before adding complexity.</p>
            </div>
            <ol className="process-grid">
              {process.map(([title, text], index) => (
                <li key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section review-section" id="homepage-review">
          <div className="container review-layout">
            <div className="form-intro">
              <p className="eyebrow"><span />A useful first step</p>
              <h2>Get a free homepage review.</h2>
              <p>Tell me what your business needs from its website. I&apos;ll review the public homepage for a few objective opportunities and respond with a concise, practical perspective.</p>
              <ul>
                <li><Check size={17} /> Mobile experience and clarity</li>
                <li><Check size={17} /> Contact and conversion path</li>
                <li><Check size={17} /> A focused next-step recommendation</li>
              </ul>
              <small>This is not a security, SEO, accessibility, or legal-compliance audit.</small>
            </div>
            <PublicForm type="homepage-review" />
          </div>
        </section>

        <section className="section faq-section" id="faq">
          <div className="container faq-layout">
            <div className="section-heading"><p className="eyebrow"><span />Questions, answered</p><h2>Before we start.</h2></div>
            <div className="faq-list">
              {faqs.map(([question, answer], index) => (
                <details key={question} data-faq-index={index}>
                  <summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section project-section" id="project-request">
          <div className="container project-layout">
            <div className="form-intro">
              <p className="eyebrow"><span />Have a project in mind?</p>
              <h2>Let&apos;s make the next step clear.</h2>
              <p>Share the goal, current challenge, and approximate scope. Orbisy will review the request and follow up personally.</p>
            </div>
            <PublicForm type="project-request" />
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-main">
          <div><a className="public-brand footer-brand" href="#top" aria-label="Orbisy home"><OrbisyLogo className="footer-brand-logo" /></a><p>Modern websites and lightweight business tools for growing companies.</p></div>
          <div><span>Explore</span><a href="#services">Services</a><a href="#work">Concept work</a><a href="#process">Process</a></div>
          <div>
            <span>Start a conversation</span>
            <TrackLink href="mailto:info@orbisy.com" eventName="contact_link_click" componentId="footer_email"><Mail size={15} /> info@orbisy.com</TrackLink>
            <p>Chicago, Illinois</p>
          </div>
        </div>
        <div className="container footer-bottom">
          <p>© {new Date().getFullYear()} Orbisy. Built thoughtfully in Chicago.</p>
          <div><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div>
        </div>
      </footer>
    </>
  );
}
