import type { Metadata } from "next";
import { associationServices } from "@/lib/association-services";
import { AssociationServicePage } from "@/components/association-service-page";
const service = associationServices[2];
export const metadata: Metadata = { title: service.title, description: service.description, alternates: { canonical: "/integrations" }, openGraph: { title: service.title + " | Orbisy", description: service.description, url: "/integrations" } };
export default function Page() { return <AssociationServicePage service={service}/>; }
