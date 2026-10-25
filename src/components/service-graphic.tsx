import { CodeXml, MapPin, MousePointer2, ShieldCheck, TrendingUp, Workflow } from "lucide-react";
import type { Engagement } from "@/lib/engagements";

// Code-native artwork stays crisp at every size and needs no image downloads.
const motifs = {
  "web-design": { Icon: MousePointer2, path: "M32 34h96v64H32z M32 48h96 M44 60h30v26H44z M84 62h32 M84 72h24 M84 82h18" },
  "google-ads": { Icon: TrendingUp, path: "M32 96h104 M42 88V72h16v16 M74 88V54h16v34 M106 88V32h16v56 M36 55l29-18 28 6 35-24" },
  "local-seo": { Icon: MapPin, path: "M26 48l34-12 36 12 36-12v64l-36 12-36-12-34 12z M60 36v64 M96 48v64" },
  "custom-development": { Icon: CodeXml, path: "M54 42L30 66l24 24 M108 42l24 24-24 24 M92 28L72 104 M22 112h118" },
  "automated-follow-up": { Icon: Workflow, path: "M26 34h36v24H26z M100 76h36v24h-36z M62 46h40v18 M118 64v12 M44 58v30h44 M76 80l12 8-12 8" },
  "website-maintenance": { Icon: ShieldCheck, path: "M80 24l44 16v30c0 22-24 36-44 44-20-8-44-22-44-44V40z M58 68l14 14 32-32" },
};

export function ServiceGraphic({ slug }: { slug: Engagement["slug"] }) {
  const { Icon, path } = motifs[slug];
  return (
    <span className={`service-card-art service-card-art-${slug}`} aria-hidden="true">
      <span className="service-art-orbit service-art-orbit-one" />
      <span className="service-art-orbit service-art-orbit-two" />
      <svg viewBox="0 0 160 136" className="service-art-blueprint" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d={path} /><circle cx="142" cy="24" r="3" /><path d="M16 18h8 M20 14v8 M132 118h12" /></svg>
      <span className="service-art-icon"><Icon size={30} strokeWidth={1.6} /></span>
      <span className="service-art-spark" />
    </span>
  );
}
