import { notFound, permanentRedirect } from "next/navigation";
import { industries } from "@/lib/industries";
export function generateStaticParams() { return industries.map(({slug})=>({industry: slug})); }
export default async function Page({params}: {params: Promise<{industry: string}>}) {
 const {industry} = await params;
 if (!industries.some(item => item.slug === industry)) notFound();
 permanentRedirect("/work");
}
