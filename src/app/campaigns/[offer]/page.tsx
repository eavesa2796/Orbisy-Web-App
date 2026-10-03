import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { campaigns } from "@/lib/campaigns";
import { PublicHeader, PublicFooter } from "@/components/public-site-shell";
import { AgencyContact } from "@/components/agency-contact";
export function generateStaticParams() {
  return Object.keys(campaigns).map((offer) => ({ offer }));
}
function getOffer(offer: string) {
  return campaigns[offer as keyof typeof campaigns];
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ offer: string }>;
}): Promise<Metadata> {
  const { offer } = await params;
  const c = getOffer(offer);
  if (!c) notFound();
  return {
    title: c.title,
    description: c.description,
    robots: { index: false, follow: true },
    alternates: { canonical: `/campaigns/${offer}` },
    openGraph: { url: `/campaigns/${offer}` },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ offer: string }>;
}) {
  const { offer } = await params;
  const c = getOffer(offer);
  if (!c) notFound();
  return (
    <>
      <PublicHeader />
      <main id="main-content">
        <section className="section service-hero">
          <div className="container">
            <p className="eyebrow">Orbisy · Work directly with Anthony Eaves</p>
            <h1>{c.title}</h1>
            <p className="hero-lede">{c.description}</p>
            <a className="button" href="#contact">
              Request a consultation
            </a>
          </div>
        </section>
        <section className="section scope-section">
          <div className="container scope-layout">
            <div>
              <h2>A defined starting scope.</h2>
              <p>
                We confirm your goals and responsibilities, then provide a
                written scope before paid work begins.
              </p>
              <Link className="text-link" href={c.detail}>
                Full service details →
              </Link>
            </div>
            <ul className="scope-deliverables">
              {c.deliverables.map((d, i) => (
                <li key={d}>
                  <span>0{i + 1}</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </section>
        <AgencyContact service={c.service} />
      </main>
      <PublicFooter />
    </>
  );
}
