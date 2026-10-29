import Image from "next/image";
import { ArrowUpRight, LayoutPanelTop, Navigation, PhoneCall } from "lucide-react";
import "./rescue-tow-comparison.css";

export const rescueTowRedesign = {
  image: "/work/rescue-tow-truck-redesign-20261029.jpg",
  alt: "Rescue Tow Truck redesign preview with fleet photography, a large left-aligned headline, and red call buttons, captured October 29, 2026",
  url: "https://rescue-tow-truck.throbbing-poetry-33b6.workers.dev/",
  tag: "Towing website redesign · Preview",
  summary: "A new visual direction, with the next call easy to find.",
  details: "The redesign preview brings fleet photography, a prominent phone contact, and grouped service and service-area navigation into a consistent layout. Service links and a three-step explanation help visitors explore the available help. This is a design and implementation preview, not a report of marketing results.",
  points: [
    "Fleet imagery paired with a stronger headline hierarchy",
    "Visible phone links in the header and homepage hero",
    "Grouped services, service areas, and company information",
  ],
};

export function RescueTowComparison() {
  return (
    <section className="section tow-comparison" id="rescue-tow-truck-comparison" aria-labelledby="tow-comparison-heading">
      <div className="container">
        <div className="section-heading split-heading">
          <div><p className="eyebrow"><span />Before & after · Website redesign</p><h2 id="tow-comparison-heading">Rescue Tow Truck.<br />A new direction for the next call.</h2></div>
          <p>A visual comparison of the previously published homepage and the new redesign preview. The focus: fleet imagery, clearer page hierarchy, and a visible path to calling.</p>
        </div>
        <div className="tow-comparison-grid">
          <figure className="tow-comparison-panel">
            <figcaption className="tow-comparison-heading"><div><span className="tow-stage">Before</span><h3>Previously published homepage</h3></div><span className="tow-reference">Reference design</span></figcaption>
            <a className="tow-screenshot-link" href="/work/rescue-tow-truck-before-20261029.jpg" target="_blank" rel="noopener noreferrer" aria-label="View full-size Rescue Tow Truck before screenshot (opens in a new tab)">
              <Image src="/work/rescue-tow-truck-before-20261029.jpg" alt="Rescue Tow Truck before redesign, with a centered towing headline over a vehicle photograph, captured October 29, 2026" width={1348} height={926} sizes="(max-width: 800px) 100vw, 50vw" />
              <span>View full-size screenshot <ArrowUpRight size={15} aria-hidden="true" /></span>
            </a>
            <p className="tow-image-note">Earlier design shown for comparison.</p>
            <a className="text-link" href="https://www.rescuetowtruck.com/" target="_blank" rel="noopener noreferrer">Visit the current website <ArrowUpRight size={15} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
          </figure>
          <figure className="tow-comparison-panel tow-comparison-after">
            <figcaption className="tow-comparison-heading"><div><span className="tow-stage">After</span><h3>New website design</h3></div><span className="tow-preview-status">Redesign preview</span></figcaption>
            <a className="tow-screenshot-link" href={rescueTowRedesign.image} target="_blank" rel="noopener noreferrer" aria-label="View full-size Rescue Tow Truck redesign screenshot (opens in a new tab)">
              <Image src={rescueTowRedesign.image} alt={rescueTowRedesign.alt} width={1348} height={926} sizes="(max-width: 800px) 100vw, 50vw" />
              <span>View full-size screenshot <ArrowUpRight size={15} aria-hidden="true" /></span>
            </a>
            <p className="tow-image-note">New design at the supplied preview address.</p>
            <a className="text-link" href={rescueTowRedesign.url} target="_blank" rel="noopener noreferrer">Explore the redesign preview <ArrowUpRight size={15} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
          </figure>
        </div>
        <div className="tow-design-notes" aria-label="Visible changes in the redesign">
          {[
            { Icon: LayoutPanelTop, title: "A stronger visual hierarchy", text: "A large left-aligned headline and fleet photograph give the hero a distinct focal point." },
            { Icon: PhoneCall, title: "The phone number up front", text: "The header and hero show direct call links with a visible phone number." },
            { Icon: Navigation, title: "More ways to explore", text: "Grouped Services, Service areas, and About Rescue navigation organize the next steps." },
          ].map(({ Icon, title, text }) => <div key={title}><Icon size={22} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></div>)}
        </div>
        <p className="tow-comparison-footnote">Both desktop screenshots captured October 29, 2026 at matching dimensions. “Before” is a reference to the earlier site; the new design is shown as a preview. This comparison does not claim measured changes in traffic, inquiries, or revenue.</p>
      </div>
    </section>
  );
}
