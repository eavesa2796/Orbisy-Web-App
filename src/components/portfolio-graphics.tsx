import Image from "next/image";
import { BookOpen, CalendarDays, ClipboardCheck, LayoutDashboard, UsersRound } from "lucide-react";
import type { CSSProperties } from "react";
import "./portfolio-graphics.css";

export function AssociationOfferBanner() {
  return (
    <div className="association-offer-banner" role="group" aria-label="Illustrative overview of Orbisy services for associations">
      <div className="association-offer-heading">
        <span className="association-offer-kicker">WEBSITES · MEMBER WORKFLOWS · INTEGRATIONS</span>
        <h4>Make the next step clear for members and staff.</h4>
        <p>Practical digital tools, shaped around your association’s work.</p>
      </div>
      <div className="association-offer-services">
        <article>
          <span className="offer-service-mark offer-service-mark-web" aria-hidden="true"><i /><i /><i /></span>
          <h5>Association websites</h5>
          <p>Help people find membership, events, and resources.</p>
        </article>
        <article>
          <span className="offer-service-mark offer-service-mark-portal" aria-hidden="true"><i /><i /><i /></span>
          <h5>Member portals</h5>
          <p>Support a defined member or staff workflow.</p>
        </article>
        <article>
          <span className="offer-service-mark offer-service-mark-connect" aria-hidden="true"><i /><i /><i /></span>
          <h5>Connected systems</h5>
          <p>Check access and feasibility before integration work.</p>
        </article>
      </div>
      <div className="association-offer-process" aria-label="Project process">
        <span>Understand the workflow</span><i aria-hidden="true" />
        <span>Agree on the scope</span><i aria-hidden="true" />
        <span>Build, test, and hand over</span>
      </div>
    </div>
  );
}

export function DesignProcessBanner() {
  return (
    <div className="design-process-banner" role="group" aria-label="Website design process from planning to visual direction to refinement">
      <div className="design-process-banner-heading">
        <span>FROM FIRST SKETCH TO A CLEAR DIRECTION</span>
        <h4>Your idea, taking shape.</h4>
      </div>
      <div className="design-process-stages">
        <article>
          <div className="design-stage-art design-stage-wireframe" aria-hidden="true"><i /><i /><i /><i /></div>
          <div><h5>Plan the structure</h5><p>Organize content around what visitors need to do.</p></div>
        </article>
        <article>
          <div className="design-stage-art design-stage-visual" aria-hidden="true"><i /><i /><i /><i /></div>
          <div><h5>Explore a direction</h5><p>Bring your brand, imagery, and page hierarchy together.</p></div>
        </article>
        <article>
          <div className="design-stage-art design-stage-refine" aria-hidden="true"><i /><i /></div>
          <div><h5>Refine for launch</h5><p>Review desktop and mobile before development begins.</p></div>
        </article>
      </div>
    </div>
  );
}

const memberActivity = [34, 48, 41, 58, 50, 68, 62, 78, 65, 86, 74, 92];

export function AssociationDashboardGraphic() {
  return (
    <div
      className="association-dashboard-graphic"
      role="img"
      aria-label="Illustrative Orbisy association dashboard with sample counts for active members, renewals, event registrations, and applications"
    >
      <header className="association-dashboard-header">
        <Image src="/orbisy-horizontal-color.png" alt="Orbisy" width={151} height={62} />
        <div className="association-dashboard-header-title">
          <span>ASSOCIATION WORKSPACE</span>
          <strong>Member &amp; program overview</strong>
        </div>
        <span className="association-dashboard-sample">ILLUSTRATIVE SAMPLE DATA</span>
      </header>
      <div className="association-dashboard-body">
        <nav className="association-dashboard-nav" aria-hidden="true">
          <span className="is-current"><LayoutDashboard />Overview</span>
          <span><UsersRound />Members</span>
          <span><CalendarDays />Events</span>
          <span><ClipboardCheck />Applications</span>
          <span><BookOpen />Resources</span>
        </nav>
        <div className="association-dashboard-main">
          <div className="association-dashboard-title-row">
            <div><span>OVERVIEW</span><h5>Member activity at a glance</h5></div>
            <span className="association-dashboard-period">Sample snapshot</span>
          </div>
          <div className="association-dashboard-metrics">
            <div><span>ACTIVE MEMBERS</span><strong>1,248</strong><small>Current member records</small></div>
            <div><span>RENEWALS DUE</span><strong>38</strong><small>In the next 30 days</small></div>
            <div><span>EVENT SIGN-UPS</span><strong>286</strong><small>Across upcoming events</small></div>
            <div><span>OPEN APPLICATIONS</span><strong>12</strong><small>Awaiting staff review</small></div>
          </div>
          <div className="association-dashboard-panels">
            <section className="association-dashboard-chart">
              <div className="association-dashboard-panel-heading"><div><h6>Member activity</h6><p>Example monthly pattern</p></div><span>Sample</span></div>
              <div className="association-dashboard-chart-area" aria-hidden="true">
                <div className="association-dashboard-grid-lines"><i /><i /><i /></div>
                <div className="association-dashboard-bars">
                  {memberActivity.map((height, index) => <i key={index} style={{ "--bar-height": `${height}%` } as CSSProperties} />)}
                </div>
              </div>
              <div className="association-dashboard-months" aria-hidden="true"><span>JAN</span><span>MAR</span><span>MAY</span><span>JUL</span><span>SEP</span><span>NOV</span></div>
            </section>
            <section className="association-dashboard-next">
              <div className="association-dashboard-panel-heading"><div><h6>Coming up</h6><p>Example team reminders</p></div><span>3 items</span></div>
              <div><i className="dashboard-reminder-dot" /><p><strong>Annual meeting</strong><small>Review event registrations</small></p></div>
              <div><i className="dashboard-reminder-dot dashboard-reminder-mint" /><p><strong>Renewal notices</strong><small>38 member records due soon</small></p></div>
              <div><i className="dashboard-reminder-dot dashboard-reminder-violet" /><p><strong>Applications</strong><small>12 items awaiting review</small></p></div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
