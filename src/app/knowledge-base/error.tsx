"use client";
import Link from "next/link";
export default function KnowledgeError({ reset }: {
    reset: () => void;
}) { return <main id="main-content" className="container" style={{ paddingBlock: 90 }}><h1>This guide is temporarily unavailable</h1><p>Please try again or contact Orbisy about your question.</p><button className="button" onClick={reset}>Try again</button><Link href="/knowledge-base" className="text-link">Back to the knowledge base</Link></main>; }
