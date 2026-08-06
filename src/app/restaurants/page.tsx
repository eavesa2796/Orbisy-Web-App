import type { Metadata } from "next";
import { AudienceLandingPage } from "@/components/audience-landing-page";

export const metadata: Metadata = {
  title: "Grease-interceptor records for restaurant operators",
  description: "Organized grease-interceptor service histories, apparent missing-document review, and upcoming dates for multi-location restaurant teams.",
  alternates: { canonical: "/restaurants" },
  openGraph: { url: "/restaurants", title: "Grease-interceptor records for restaurant operators | Orbisy", description: "Organized service histories and upcoming dates for multi-location restaurant teams." },
  twitter: { title: "Grease-interceptor records for restaurant operators | Orbisy", description: "Organized service histories and upcoming dates for multi-location restaurant teams." },
};

const benefits = [
  { title: "Multi-location visibility", text: "See locations, known interceptors, available service records, apparent gaps, and upcoming dates in one consistent view." },
  { title: "Independent history across haulers", text: "Keep a usable service history when vendors, managers, or internal processes change." },
  { title: "Missing-document detection", text: "Compare expected service with available evidence and identify records that appear incomplete, unmatched, or missing." },
  { title: "Upcoming dates", text: "Maintain an agreed calendar so service and supporting documentation are easier to follow." },
  { title: "Manager and vendor transitions", text: "Give incoming managers and replacement vendors a clearer, retrievable record of prior activity." },
] as const;

export default function RestaurantsPage() {
  return <AudienceLandingPage eyebrow="For restaurant operators" title="One organized grease-service history across every location." lede="Orbisy helps restaurant groups reconcile customer-supplied service tickets and supporting evidence, identify apparent documentation gaps, and maintain agreed upcoming dates—without replacing the current grease hauler." benefits={benefits} conceptImages={[{ src: "/restaurant-portal-location-concept.webp", alt: "Concept design showing a restaurant location's service history, asset details, documents, and upcoming service", orientation: "wide" }, { src: "/restaurant-portal-mobile-concept.webp", alt: "Mobile concept design showing a restaurant group's locations, record status, open items, and next service", orientation: "tall" }]} pilotTitle="A focused cleanup for a defined group of locations." pilotText="The initial pilot is scoped and priced through a written agreement after a short workflow review." pilotItems={["Confirm locations, known interceptors, haulers, and expected schedules", "Organize the agreed set of existing tickets and supporting evidence", "Identify apparent missing, incomplete, or unmatched documentation", "Deliver an organized history, gap report, and upcoming calendar"]} />;
}
