import Link from "next/link";
import styles from "./association-website-concept.module.css";

const destinations = [
  ["Home", "#concept-home"],
  ["Membership", "#concept-membership"],
  ["Events", "#concept-events"],
  ["Member portal", "#concept-portal"],
] as const;

export function AssociationWebsiteConcept() {
  return (
    <div className={styles.page}>
      <section className={styles.intro}>
        <div className="container">
          <Link className="text-link" href="/work">
            ← Our Work
          </Link>
          <p className="eyebrow">Association website · Illustrative concept</p>
          <h1>A clearer path through association life.</h1>
          <p className={styles.lede}>
            Explore a sample website organized around the people an association
            serves: prospective members, current members, event attendees, and
            staff.
          </p>
          <p className={styles.disclaimer}>
            Concept project — not client work. All copy and interface details are
            illustrative. The member portal and system connections shown here
            are not live.
          </p>
        </div>
      </section>

      <section className={styles.prototypeSection} aria-labelledby="prototype-title">
        <div className="container">
          <div className={styles.prototypeHeading}>
            <div>
              <p className="eyebrow">Explore the concept</p>
              <h2 id="prototype-title">One site. Four useful paths.</h2>
            </div>
            <p>
              Use the navigation to jump between the public website and a
              sample member area. This prototype uses in-page links and sample
              content only.
            </p>
          </div>

          <div className={styles.browser}>
            <div className={styles.browserBar} aria-hidden="true">
              <span />
              <span />
              <span />
              <p>Association website concept · preview</p>
              <strong>Illustrative</strong>
            </div>
            <div className={styles.mockSite}>
              <header className={styles.mockHeader}>
                <a className={styles.wordmark} href="#concept-home">
                  <span className={styles.mark} aria-hidden="true">A</span>
                  <span>Association concept</span>
                </a>
                <nav className={styles.mockNav} aria-label="Concept pages">
                  {destinations.map(([label, href]) => (
                    <a key={href} href={href}>{label}</a>
                  ))}
                </nav>
                <a className={styles.memberLink} href="#concept-portal">
                  Member area
                </a>
              </header>

              <section className={styles.homeScreen} id="concept-home" aria-labelledby="concept-home-title">
                <div className={styles.homeCopy}>
                  <p className={styles.screenLabel}>Home · sample content</p>
                  <h3 id="concept-home-title">A stronger community starts with a place to connect.</h3>
                  <p>
                    Find a way in, take part in the work, and keep the resources
                    you need close at hand.
                  </p>
                  <div className={styles.actions}>
                    <a className={styles.primaryAction} href="#concept-membership">Explore membership</a>
                    <a className={styles.secondaryAction} href="#concept-events">Find an event</a>
                  </div>
                </div>
                <aside className={styles.homeAside}>
                  <p className={styles.screenLabel}>For every stage</p>
                  <a href="#concept-membership"><strong>Considering membership</strong><span>Understand the value and next steps →</span></a>
                  <a href="#concept-events"><strong>Looking for an event</strong><span>Find details before continuing to registration →</span></a>
                  <a href="#concept-portal"><strong>Already a member</strong><span>Go straight to member resources →</span></a>
                </aside>
              </section>

              <section className={styles.screen} id="concept-membership" aria-labelledby="concept-membership-title">
                <div className={styles.screenIntro}>
                  <p className={styles.screenLabel}>Membership · sample content</p>
                  <h3 id="concept-membership-title">Make it easy to understand what membership offers.</h3>
                  <p>
                    Explain who membership serves, what members can access, and
                    what happens after someone applies or renews.
                  </p>
                </div>
                <div className={styles.cardGrid}>
                  <article className={styles.infoCard}><span>01</span><h4>Learn</h4><p>Continuing education, practical resources, and shared expertise.</p></article>
                  <article className={styles.infoCard}><span>02</span><h4>Connect</h4><p>Ways to meet peers and take part in the association community.</p></article>
                  <article className={styles.infoCard}><span>03</span><h4>Contribute</h4><p>Committees, volunteer roles, and opportunities to shape the field.</p></article>
                </div>
                <p className={styles.microcopy}>Membership categories, eligibility, fees, and application steps would be supplied and approved by the organization.</p>
              </section>

              <section className={styles.screenAlt} id="concept-events" aria-labelledby="concept-events-title">
                <div className={styles.screenIntro}>
                  <p className={styles.screenLabel}>Events · sample content</p>
                  <h3 id="concept-events-title">Give each event a clear next step.</h3>
                  <p>
                    Put the useful details first, then make it clear where
                    registration continues.
                  </p>
                </div>
                <div className={styles.eventCard}>
                  <div className={styles.eventDate}><span>Sample</span><strong>Event</strong></div>
                  <div className={styles.eventCopy}>
                    <p className={styles.screenLabel}>Illustrative listing</p>
                    <h4>Member learning session</h4>
                    <p>Program overview, audience, accessibility details, and contact information would appear here.</p>
                  </div>
                  <a className={styles.secondaryAction} href="#concept-portal">View event flow</a>
                </div>
                <p className={styles.microcopy}>Registration is a handoff concept. No event platform or registration service is connected.</p>
              </section>

              <section className={styles.portalScreen} id="concept-portal" aria-labelledby="concept-portal-title">
                <div className={styles.portalIntro}>
                  <p className={styles.screenLabel}>Member portal · interface concept</p>
                  <h3 id="concept-portal-title">A useful starting point for members.</h3>
                  <p>
                    A focused member area can bring common tasks together while
                    keeping account data in the organization’s approved system.
                  </p>
                </div>
                <div className={styles.portal}>
                  <aside className={styles.portalRail}>
                    <p>Member area</p>
                    <a href="#portal-overview" aria-current="page">Overview</a>
                    <a href="#portal-profile">Profile & renewal</a>
                    <a href="#portal-directory">Member directory</a>
                    <a href="#portal-resources">Resources</a>
                  </aside>
                  <div className={styles.portalContent} id="portal-overview">
                    <p className={styles.screenLabel}>Sample member view · no account data</p>
                    <h4>What would you like to do?</h4>
                    <div className={styles.portalCards}>
                      <article id="portal-profile"><span>Account</span><strong>Review profile and renewal details</strong><small>Example task · connection not implemented</small></article>
                      <article id="portal-directory"><span>Community</span><strong>Find the right member directory view</strong><small>Example task · sample data only</small></article>
                      <article id="portal-resources"><span>Resources</span><strong>Browse member-only materials</strong><small>Example task · access is not connected</small></article>
                    </div>
                    <p className={styles.portalNotice}>This screen demonstrates a possible layout. There is no sign-in, member record, directory, or live connection behind it.</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className={styles.projectNotes}>
            <article>
              <p className="eyebrow">Public website</p>
              <h3>Help each audience find its next step.</h3>
              <p>Membership, events, and resources are organized around common visitor tasks rather than an internal department chart.</p>
            </article>
            <article>
              <p className="eyebrow">Staff & systems</p>
              <h3>Agree on the handoffs before building.</h3>
              <p>Content owners, access rules, source systems, and registration paths would be confirmed during discovery before any integration is scoped.</p>
            </article>
          </div>

          <div className={styles.scopeNote}>
            <strong>What is and is not shown</strong>
            <p>
              This is an illustrative design concept, not an association client
              project or a finished product. Names, content, and interface
              details are examples. The portal, account actions, and external
              system handoffs are not implemented.
            </p>
          </div>
          <div className={styles.nextStep}>
            <div>
              <p className="eyebrow">Planning a real project?</p>
              <h2>Start with the people and the work.</h2>
              <p>We can map the audiences, content, and existing systems before defining a scope.</p>
            </div>
            <Link className="button" href="/#contact">Discuss an association website</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
