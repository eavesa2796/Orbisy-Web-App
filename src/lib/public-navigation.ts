import { associationServices } from "@/lib/association-services";
export const serviceNavigation = associationServices.map(service => ({ label: service.title, description: service.description, href: `/${service.slug}` }));
