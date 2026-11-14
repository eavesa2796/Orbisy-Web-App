import type { Metadata } from "next";
import { associationServices } from "@/lib/association-services";
import { AssociationServicePage } from "@/components/association-service-page";
const service = associationServices[1];
export const metadata: Metadata = { title: service.title, description: service.description, alternates: { canonical: "/member-portals" }, openGraph: { title: service.title + " | Orbisy", description: service.description, url: "/member-portals" } };
export default function Page() { return <AssociationServicePage service={service}/>; }
