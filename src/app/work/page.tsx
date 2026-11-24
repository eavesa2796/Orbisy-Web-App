import type { Metadata } from "next";
import { RescueTowComparison } from "@/components/rescue-tow-comparison";
import { Portfolio } from "@/components/portfolio";
import { PublicHeader, PublicFooter } from "@/components/public-site-shell";
import { AgencyContact } from "@/components/agency-contact";
export const metadata: Metadata = {
  title: "Website work & custom software concepts",
  description:
    "Explore Orbisy’s Rescue Tow Truck before-and-after redesign comparison, live website work, an illustrative association website concept, design process, and a custom software dashboard concept.",
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
            <h1>Real website work. Clearly labeled concepts.</h1>
            <p className="hero-lede">
              Explore live website projects for towing and mobile battery
              service, an illustrative association website concept, a design-process concept, and a dashboard concept in progress. Orbisy does not yet have association case studies or a finished association software product.
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
