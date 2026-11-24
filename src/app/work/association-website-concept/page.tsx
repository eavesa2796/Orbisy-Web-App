import type { Metadata } from "next";
import { AgencyContact } from "@/components/agency-contact";
import { AssociationWebsiteConcept } from "@/components/association-website-concept";
import { PublicFooter, PublicHeader } from "@/components/public-site-shell";

export const metadata: Metadata = {
  title: "Association website concept",
  description:
    "Explore an illustrative association website concept for member, event, and staff journeys. Sample content only; no live portal or integrations.",
  alternates: { canonical: "/work/association-website-concept" },
  openGraph: { url: "/work/association-website-concept" },
};

export default function Page() {
  return (
    <>
      <PublicHeader />
      <main id="main-content">
        <AssociationWebsiteConcept />
        <AgencyContact service="Association website" />
      </main>
      <PublicFooter />
    </>
  );
}
