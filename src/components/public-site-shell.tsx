import { Mail, Menu, Phone } from "lucide-react";
import Link from "next/link";
import { OrbisyLogo } from "@/components/orbisy-logo";
import { TrackLink } from "@/components/track-link";

export function PublicHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="public-brand" href="/" aria-label="Orbisy home">
          <OrbisyLogo className="public-brand-logo" priority />
        </Link>
        <nav className="desktop-nav" aria-label="Public navigation">
          <Link href="/haulers">Grease Haulers</Link>
          <Link href="/restaurants">Restaurants</Link>
          <Link href="/#services">Services</Link>
          <Link href="/#about">About</Link>
        </nav>
        <TrackLink
          className="button button-small"
          href="/#records-review"
          eventName="primary_cta_click"
          componentId="nav_records_review"
        >
          Request a Hauler Workflow Review
        </TrackLink>
        <details className="mobile-nav">
          <summary aria-label="Open navigation"><Menu size={22} /><span>Menu</span></summary>
          <nav aria-label="Mobile navigation">
            <Link href="/haulers">Grease Haulers</Link>
            <Link href="/restaurants">Restaurants</Link>
            <Link href="/#services">Services</Link>
            <Link href="/#about">About</Link>
            <Link className="button button-small" href="/#records-review">Request a Workflow Review</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div>
          <Link className="public-brand footer-brand" href="/" aria-label="Orbisy home">
            <OrbisyLogo className="footer-brand-logo" />
          </Link>
          <p>A managed customer-records layer for grease haulers, with direct support available for restaurant operators.</p>
        </div>
        <div>
          <span>Explore</span>
          <Link href="/#services">Services</Link>
          <Link href="/restaurants">For restaurants</Link>
          <Link href="/haulers">For grease haulers</Link>
          <Link href="/#process">Process</Link>
        </div>
        <div>
          <span>Start a conversation</span>
          <TrackLink href="mailto:info@orbisy.com" eventName="contact_link_click" componentId="footer_email">
            <Mail size={15} /> info@orbisy.com
          </TrackLink>
          <a href="tel:+12243236231"><Phone size={15} /> (224) 323-6231</a>
          <p>Based near Chicago · Supporting clients nationwide</p>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} Orbisy. Managed records today. Purpose-built software ahead.</p>
        <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      </div>
    </footer>
  );
}
