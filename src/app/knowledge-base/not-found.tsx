import Link from "next/link";
import { PublicHeader, PublicFooter } from "@/components/public-site-shell";
export default function KnowledgeNotFound() { return <><PublicHeader /><main id="main-content" className="container" style={{ paddingBlock: 90 }}><p className="eyebrow">Orbisy knowledge base</p><h1>This article isn’t available</h1><p>The address may have changed, or the article may no longer be published.</p><Link className="button" href="/knowledge-base">Browse published guides</Link></main><PublicFooter /></>; }
