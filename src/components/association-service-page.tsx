import Link from "next/link";
import { Check } from "lucide-react";
import { PublicHeader, PublicFooter } from "@/components/public-site-shell";
import { AgencyContact } from "@/components/agency-contact";
import { AssociationServices, AssociationProcess } from "@/components/association-sections";
import type { AssociationService } from "@/lib/association-services";
export function AssociationServicePage({ service }: { service: AssociationService }) {
  return <><PublicHeader/><main id="main-content" className="association-page"><section className="section service-hero"><div className="container"><Link className="text-link" href="/services">Services / {service.title}</Link><p className="eyebrow">{service.title}</p><h1>{service.headline}</h1><p className="hero-lede">{service.intro}</p><a className="button" href="#contact">Discuss your project</a></div></section>
    <section className="section scope-section"><div className="container scope-layout"><div><p className="eyebrow">An engagement, not a product</p><h2>A scope you can review.</h2><p>These are possible project components. Discovery establishes what your organization needs and what the existing systems can support.</p><Link className="text-link" href="/work">Explore real website work →</Link></div><ul className="scope-deliverables">{service.deliverables.map((item,i)=><li key={item}><span>0{i+1}</span>{item}</li>)}</ul></div></section>
    <section className="section"><div className="container"><div className="scope-notes"><article><h2>What we need from you</h2><p>{service.responsibilities}</p></article><article><h2>How pricing works</h2><p>{service.scope}</p><Link href="/pricing" className="text-link">Project quotes & ongoing support →</Link></article></div><p className="association-fineprint"><Check size={16} aria-hidden="true"/>Features, access, deliverables, and responsibilities are agreed before implementation.</p></div></section>
    <AssociationProcess/><section className="section faq-section"><div className="container faq-layout"><div><p className="eyebrow">Before you decide</p><h2>Useful details.</h2></div><div className="faq-list">{service.faq.map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></div></section>
    <AgencyContact service={service.title}/><section className="section"><div className="container"><div className="section-heading"><p className="eyebrow">Other ways to work with Orbisy</p><h2>Build on the right foundation.</h2></div><AssociationServices exclude={service.slug}/></div></section>
  </main><PublicFooter/></>;
}
