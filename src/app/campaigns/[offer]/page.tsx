import { notFound, permanentRedirect } from "next/navigation";
import { campaigns } from "@/lib/campaigns";
export function generateStaticParams() { return Object.keys(campaigns).map(offer=>({offer})); }
export default async function Page({params}: {params: Promise<{offer: string}>}) {
 const {offer} = await params;
 if (!Object.hasOwn(campaigns, offer)) notFound();
 permanentRedirect("/associations");
}
