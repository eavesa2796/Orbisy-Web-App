import type { Metadata } from "next";
import { Portfolio } from "@/components/portfolio";
import { PublicHeader, PublicFooter } from "@/components/public-site-shell";
import { AgencyContact } from "@/components/agency-contact";
export const metadata: Metadata = {
  title: "Selected website work",
  description:
    "Explore Orbisy’s live website work and an illustrative look inside the website design process.",
  alternates: { canonical: "/work" },
  openGraph: { url: "/work" },
};
export default function Page() {
  return (
    <>
      <PublicHeader />
      <main id="main-content">
        <section className="section service-hero">
          <div className="container">
            <p className="eyebrow">Orbisy’s portfolio</p>
            <h1>Websites built for real service businesses.</h1>
            <p className="hero-lede">
              Explore live website projects for towing and mobile battery
              service, plus an illustrative look at wireframing, visual design,
              and refinement.
            </p>
          </div>
        </section>
        <Portfolio full />
        <AgencyContact />
      </main>
      <PublicFooter />
    </>
  );
}
