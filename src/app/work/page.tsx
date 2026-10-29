import type { Metadata } from "next";
import { RescueTowComparison } from "@/components/rescue-tow-comparison";
import { Portfolio } from "@/components/portfolio";
import { PublicHeader, PublicFooter } from "@/components/public-site-shell";
import { AgencyContact } from "@/components/agency-contact";
export const metadata: Metadata = {
  title: "Website work & custom software concepts",
  description:
    "Explore Orbisy’s Rescue Tow Truck before-and-after redesign comparison, live website work, design process, and a custom software dashboard concept.",
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
            <h1>Websites and software, shaped around your business.</h1>
            <p className="hero-lede">
              Explore live website projects for towing and mobile battery
              service, an illustrative look at the design process, and a custom
              software dashboard concept in progress. Orbisy builds tools for the
              parts of your business you may not have thought software could help.
            </p>
          </div>
        </section>
        <RescueTowComparison />
        <Portfolio full />
        <AgencyContact />
      </main>
      <PublicFooter />
    </>
  );
}
