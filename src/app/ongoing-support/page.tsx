import type { Metadata } from "next";
import { associationServices } from "@/lib/association-services";
import { AssociationServicePage } from "@/components/association-service-page";
const service = associationServices[3];
export const metadata: Metadata = { title: service.title, description: service.description, alternates: { canonical: "/ongoing-support" }, openGraph: { title: service.title + " | Orbisy", description: service.description, url: "/ongoing-support" } };
export default function Page() { return <AssociationServicePage service={service}/>; }
