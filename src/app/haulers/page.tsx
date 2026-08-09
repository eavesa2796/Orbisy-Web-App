import type { Metadata } from "next";
import { AudienceLandingPage } from "@/components/audience-landing-page";

export const metadata: Metadata = {
  title: "Organized customer service histories for grease haulers",
  description: "Managed grease-interceptor record organization for haulers that want cleaner evidence delivery and professional customer histories.",
  alternates: { canonical: "/haulers" },
  openGraph: { url: "/haulers", title: "Organized customer service histories for grease haulers | Orbisy", description: "Cleaner evidence delivery and professional customer histories without replacing dispatch or billing systems." },
  twitter: { title: "Organized customer service histories for grease haulers | Orbisy", description: "Cleaner evidence delivery and professional customer histories without replacing dispatch or billing systems." },
};

const benefits = [
  { title: "Fewer requests for old tickets", text: "Give restaurant customers an organized history that is easier to retrieve when questions arise." },
  { title: "Professional customer histories", text: "Present available service events and supporting evidence in a consistent, customer-ready format." },
  { title: "Cleaner evidence delivery", text: "Reconcile driver-submitted tickets, photographs, manifests, and related records before delivery." },
  { title: "Customer retention support", text: "Provide a useful records service that strengthens the customer experience without making unsupported outcome promises." },
  { title: "Driver-submission completeness", text: "Identify apparent gaps in submitted evidence so authorized follow-up can happen while details are still current." },
] as const;

export default function HaulersPage() {
  return <AudienceLandingPage eyebrow="For grease haulers" title="Turn service records into a customer-retention advantage." lede="Orbisy gives regional grease haulers a managed, customer-facing records layer—without replacing dispatch, routing, billing, accounting, or physical service work." benefits={benefits} conceptImages={[{ src: "/hauler-portal-overview-concept.webp", alt: "Concept design showing grease-hauler schedules, crews, records, and operational exceptions", orientation: "wide" }, { src: "/hauler-portal-mobile-concept.webp", alt: "Mobile concept design showing a grease-hauler service checklist and required job evidence", orientation: "tall" }]} pilotTitle="Start with ten accounts for 30 days." pilotText="After confirming customer authorization, record availability, and a written scope, Orbisy tests the workflow with a small account group before either company commits to a larger rollout." pilotItems={["Choose up to ten representative restaurant accounts", "Map how tickets and supporting evidence reach the office", "Organize customer-ready histories and flag apparent gaps", "Review the results and decide whether a broader rollout makes sense"]} formType="hauler-request" ctaLabel="Request a Hauler Workflow Review" />;
}
