import Image from "next/image";
import { ArrowUpRight, LayoutPanelTop, Navigation, PhoneCall } from "lucide-react";
import "./rescue-tow-comparison.css";

export const rescueTowRedesign = {
  image: "/work/rescue-tow-truck-redesign-20261029.jpg",
  alt: "Rescue Tow Truck redesigned homepage with fleet photography, clear service navigation, and prominent call links",
  url: "https://www.rescuetowtruck.com/",
  tag: "Towing website redesign",
  summary: "A new visual direction, with the next call easy to find.",
  details: "The redesigned layout brings fleet photography, a prominent phone contact, and grouped service and service-area navigation into a consistent experience. The screenshot shows Orbisy’s design work; the link opens the current Rescue Tow Truck website. No marketing results are claimed.",
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
          <div><p className="eyebrow"><span />Website redesign · Live project</p><h2 id="tow-comparison-heading">Rescue Tow Truck.<br />A new direction for the next call.</h2></div>
          <p>Explore the redesigned homepage, built around clearer service choices, fleet photography, and an easy path to contact.</p>
        </div>
        <figure className="tow-comparison-panel tow-comparison-featured">
          <figcaption className="tow-comparison-heading"><div><span className="tow-stage">Redesigned website</span><h3>See the live Rescue Tow Truck website</h3></div><span className="tow-preview-status">Live website</span></figcaption>
          <a className="tow-screenshot-link" href={rescueTowRedesign.url} target="_blank" rel="noopener noreferrer" aria-label="Visit the live Rescue Tow Truck website (opens in a new tab)">
            <Image src={rescueTowRedesign.image} alt={rescueTowRedesign.alt} width={1348} height={926} sizes="(max-width: 800px) 100vw, 90vw" />
          </a>
          <p className="tow-image-note">Redesign screenshot shown above; the image opens the live website.</p>
          <a className="text-link" href={rescueTowRedesign.url} target="_blank" rel="noopener noreferrer">Visit rescuetowtruck.com <ArrowUpRight size={15} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
        </figure>
        <div className="tow-design-notes" aria-label="Visible changes in the redesign">
          {[
            { Icon: LayoutPanelTop, title: "A stronger visual hierarchy", text: "A large left-aligned headline and fleet photograph give the hero a distinct focal point." },
            { Icon: PhoneCall, title: "The phone number up front", text: "The header and hero show direct call links with a visible phone number." },
            { Icon: Navigation, title: "More ways to explore", text: "Grouped Services, Service areas, and About Rescue navigation organize the next steps." },
          ].map(({ Icon, title, text }) => <div key={title}><Icon size={22} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></div>)}
        </div>
        <p className="tow-comparison-footnote">The redesign screenshot is a visual reference, not a report of measured changes in traffic, inquiries, or revenue.</p>
      </div>
    </section>
  );
}
