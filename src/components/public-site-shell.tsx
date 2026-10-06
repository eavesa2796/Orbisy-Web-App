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
          <Link href="/towing-marketing">Towing</Link>
          <Link href="/#about">About</Link>
          <Link href="/work">Our work</Link>
        </nav>
        <TrackLink
          className="button button-small"
          href="/#contact"
          eventName="primary_cta_click"
          componentId="nav_project_request"
        >
          Request a consultation
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
          <p>
            Web design, Google Ads, local SEO, and custom development for
            service businesses.
          </p>
        </div>
        <div>
          <span>Explore</span>
          <Link href="/web-design">Web design</Link>
          <Link href="/google-ads">Google Ads</Link>
          <Link href="/local-seo">Local SEO</Link>
          <Link href="/custom-development">Custom development</Link>
          <Link href="/towing-marketing">Towing marketing</Link>
          <Link href="/work">Selected work</Link>
          <Link href="/#about">About Orbisy</Link>
          <Link href="/#contact">Request a consultation</Link>
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
