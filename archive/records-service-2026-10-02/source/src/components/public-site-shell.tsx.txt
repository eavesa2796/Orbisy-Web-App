import { Mail } from "lucide-react";
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
        <nav aria-label="Public navigation">
          <Link href="/#services">Services</Link>
          <Link href="/restaurants">Restaurants</Link>
          <Link href="/haulers">Grease Haulers</Link>
          <Link href="/#about">About</Link>
        </nav>
        <TrackLink
          className="button button-small"
          href="/#records-review"
          eventName="primary_cta_click"
          componentId="nav_records_review"
        >
          Request a Records Review
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
          <Link className="public-brand footer-brand" href="/" aria-label="Orbisy home">
            <OrbisyLogo className="footer-brand-logo" />
          </Link>
          <p>Organized grease-interceptor service records for restaurant operators and grease haulers.</p>
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
          <p>Chicago, Illinois</p>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} Orbisy. Built thoughtfully in Chicago.</p>
        <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      </div>
    </footer>
  );
}
