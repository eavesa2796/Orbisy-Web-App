import { Mail } from "lucide-react";
import Link from "next/link";
import { OrbisyLogo } from "@/components/orbisy-logo";
import { serviceNavigation, industryNavigation } from "@/lib/public-navigation";
import { PublicNavigation } from "@/components/public-navigation";
import "@/components/public-navigation.css";
import "@/components/industry-page.css";
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
          industries={industryNavigation}
        />
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
            Websites, Google Ads, local SEO, custom software, and follow-up
            for restaurants and local businesses.
          </p>
        </div>
        <div>
          <span>Explore</span>
          <Link href="/web-design">Web design</Link>
          <Link href="/google-ads">Google Ads</Link>
          <Link href="/local-seo">Local SEO</Link>
          <Link href="/custom-development">Custom development</Link>
          <Link href="/automated-follow-up">Automated follow-up</Link>
          <Link href="/website-maintenance">Website maintenance</Link>
          <Link href="/industries">Industries we help</Link>
          <Link href="/industries/restaurants">Restaurant websites & marketing</Link>
          <Link href="/towing-marketing">Towing marketing</Link>
          <Link href="/work">Selected work</Link>
          <Link href="/pricing">Pricing & packages</Link>
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
