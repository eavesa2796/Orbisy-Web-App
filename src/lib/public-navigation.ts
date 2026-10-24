import { engagements } from "@/lib/engagements";
import { industries } from "@/lib/industries";
export const serviceNavigation = engagements.map((service) => ({
  label: service.title,
  description: service.description,
  href: `/${service.slug}`,
}));
export const industryNavigation = [
  {
    label: "Towing & Roadside Assistance",
    description: "Call-focused websites and marketing for towing businesses.",
    href: "/towing-marketing",
  },
  ...industries.map((industry) => ({
    label: industry.name,
    description: industry.focus,
    href: `/industries/${industry.slug}`,
  })),
];
