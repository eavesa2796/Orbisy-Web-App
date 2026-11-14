import Link from "next/link";
import { ArrowUpRight, PanelsTopLeft, UsersRound, Cable, Wrench } from "lucide-react";
import { associationServices, engagementProcess, platformFamiliarity } from "@/lib/association-services";
export const serviceIcons = { website: PanelsTopLeft, members: UsersRound, integrations: Cable, support: Wrench };
export function AssociationServices({ exclude }: { exclude?: string }) {
  return <div className="association-service-grid">{associationServices.filter(service => service.slug !== exclude).map((service, index) => {
    const Icon = serviceIcons[service.icon];
    return <Link className="association-service-card" href={`/${service.slug}`} key={service.slug}>
      <div className="association-card-art" aria-hidden="true"><span className="association-orbit"/><Icon size={38} strokeWidth={1.4}/><span className="association-card-index">0{index+1}</span></div>
      <h3>{service.title}<ArrowUpRight size={19} aria-hidden="true"/></h3><p>{service.description}</p><span className="text-link">Explore the service →</span>
    </Link>;
  })}</div>;
}
export function AssociationProcess() {
  return <section className="section association-process" id="process"><div className="container"><div className="section-heading split-heading"><div><p className="eyebrow"><span/>How the work moves forward</p><h2>A shared plan.<br/>A practical handover.</h2></div><p>Work directly with Anthony, with clear decisions and review points from the first conversation through launch.</p></div><ol className="process-grid association-steps">{engagementProcess.map(([title, text], i) => <li key={title}><span>0{i+1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol></div></section>;
}
export function PlatformFamiliarity() {
  return <div className="association-platforms"><p className="eyebrow">Experience with association workflows</p><h2>Your existing systems are part of the conversation.</h2><p>Anthony has experience working with associations using these platforms. Each proposed connection is assessed against the specific product, available APIs, permissions, and vendor requirements.</p><ul aria-label="Platform familiarity">{platformFamiliarity.map(platform => <li key={platform}>{platform}</li>)}</ul><p className="association-fineprint">Platform familiarity—not a formal partnership, certification, or a claim of a completed integration or prebuilt connector.</p><Link className="text-link" href="/integrations">How integration discovery works →</Link></div>;
}
export function AssociationMap() {
  return <aside className="association-map" aria-label="Illustrative project areas"><div className="association-map-orbit" aria-hidden="true"/><p className="eyebrow">Built around your association</p><div className="association-map-core"><span className="association-status-dot" aria-hidden="true"/>Your organization<br/><strong>One connected experience.</strong></div><div className="association-map-items">{[
    {Icon:PanelsTopLeft,title:"Public website",text:"Find information. Join. Register."},
    {Icon:UsersRound,title:"Member experience",text:"Resources. Directories. Access."},
    {Icon:Cable,title:"Connected systems",text:"Supported data flows and sign-on."},
    {Icon:Wrench,title:"Staff workflows",text:"Applications. Approvals. Reporting."},
  ].map(({Icon,title,text}) => <div key={title}><Icon size={23} aria-hidden="true"/><div><h2>{title}</h2><p>{text}</p></div></div>)}</div><p className="association-fineprint">Illustrative project scope. Features are commissioned and assessed individually.</p></aside>;
}
