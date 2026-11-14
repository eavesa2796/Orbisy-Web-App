import { Mail } from "lucide-react";
import Link from "next/link";
import { OrbisyLogo } from "@/components/orbisy-logo";
import { serviceNavigation } from "@/lib/public-navigation";
import { PublicNavigation } from "@/components/public-navigation";
import "@/components/public-navigation.css";
import "@/components/association-site.css";
import { TrackLink } from "@/components/track-link";

export function PublicHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="public-brand" href="/" aria-label="Orbisy home">
          <OrbisyLogo className="public-brand-logo" priority />
        </Link>
        <PublicNavigation
          services={serviceNavigation}
        />
        <TrackLink
          className="button button-small"
          href="/#contact"
          eventName="primary_cta_click"
          componentId="nav_project_request"
        >
          Discuss your project
        </TrackLink>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div>
          <Link
            className="public-brand footer-brand"
            href="/"
            aria-label="Orbisy home"
          >
            <OrbisyLogo className="footer-brand-logo" />
          </Link>
          <p>Custom websites, member functionality, and scoped integrations for associations. Work directly with Anthony Eaves.</p>
        </div>
        <div>
          <span>Explore</span>
          {serviceNavigation.map(service => <Link href={service.href} key={service.href}>{service.label}</Link>)}
          <Link href="/associations">For associations</Link>
          <Link href="/work">Our Work</Link>
          <Link href="/about">About Orbisy</Link>
          <Link href="/pricing">Project quotes & support</Link>
          <Link href="/#contact">Discuss your project</Link>
        </div>
        <div>
          <span>Start a conversation</span>
          <TrackLink
            href="mailto:info@orbisy.com"
            eventName="contact_link_click"
            componentId="footer_email"
          >
            <Mail size={15} aria-hidden="true" />
            info@orbisy.com
          </TrackLink>
          <p>Chicago, Illinois</p>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>
          © {new Date().getFullYear()} Orbisy LLC. Built thoughtfully in
          Chicago.
        </p>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
