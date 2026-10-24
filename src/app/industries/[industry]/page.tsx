import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IndustryPage } from "@/components/industry-page";
import { findIndustry, industries } from "@/lib/industries";
export const dynamicParams = false;
export function generateStaticParams() {
  return industries.map((industry) => ({ industry: industry.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ industry: string }>;
}): Promise<Metadata> {
  const industry = findIndustry((await params).industry);
  if (!industry) notFound();
  const path = `/industries/${industry.slug}`;
  return {
    title: `${industry.name} Websites & Marketing`,
    description: industry.intro,
    alternates: { canonical: path },
    openGraph: {
      title: `${industry.name} | Orbisy`,
      description: industry.intro,
      url: path,
    },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const industry = findIndustry((await params).industry);
  if (!industry) notFound();
  return <IndustryPage industry={industry} />;
}
