import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PublicHeader, PublicFooter } from "@/components/public-site-shell";
import { AgencyContact } from "@/components/agency-contact";
import { industryNavigation } from "@/lib/public-navigation";
export const metadata: Metadata = {
  title: "Industries We Help",
  description:
    "Websites, Google Ads, local SEO, and follow-up systems for restaurants, towing, automotive, HVAC, plumbing, electrical, roofing, landscaping, and cleaning businesses.",
  alternates: { canonical: "/industries" },
  openGraph: { url: "/industries" },
};
export default function Page() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="industry-page">
        <section className="section service-hero">
          <div className="container">
            <p className="eyebrow">
              <span />
              Local businesses. Different ways of working.
            </p>
            <h1>
              Your industry shapes
              <br />
              the next step.
            </h1>
            <p className="hero-lede">
              A restaurant visit, a roadside call, an installation estimate,
              and a recurring cleaning request need different paths. Explore how Orbisy can
              structure the website, marketing, and follow-up around your
              business.
            </p>
          </div>
        </section>
        <section className="section industry-directory">
          <div className="container">
            <div className="industry-directory-grid">
              {industryNavigation.map((industry, index) => (
                <Link href={industry.href} key={industry.href}>
                  <span className="industry-directory-number">
                    0{index + 1}
                    <ArrowUpRight size={24} aria-hidden="true" />
                  </span>
                  <h2>{industry.label}</h2>
                  <p>{industry.description}</p>
                  <span className="text-link">Explore the approach →</span>
                </Link>
              ))}
            </div>
            <p className="industry-footnote">
              These pages describe proposed approaches for each type of
              business. Our current live portfolio features towing and mobile
              battery websites; other industry pages do not imply completed
              client work or marketing results.
            </p>
            <div className="industry-other">
              <h2>Run a different kind of business?</h2>
              <p>
                We also scope websites and custom software for other industries.
                Tell us how your business works and what you want to improve.
              </p>
              <a className="text-link" href="#contact">
                Start a conversation →
              </a>
            </div>
          </div>
        </section>
        <AgencyContact />
      </main>
      <PublicFooter />
    </>
  );
}
