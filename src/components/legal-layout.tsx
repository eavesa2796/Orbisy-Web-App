import type { ReactNode } from "react";
import Link from "next/link";
import { PublicHeader, PublicFooter } from "@/components/public-site-shell";

export function LegalLayout({
  kicker,
  title,
  current,
  children,
}: {
  kicker: string;
  title: string;
  current: "privacy" | "terms";
  children: ReactNode;
}) {
  return (
    <>
      <PublicHeader />
      <main className="legal-page" id="main-content">
      <div className="legal-shell">
        <p className="legal-kicker">{kicker}</p>
        <h1>{title}</h1>
        <nav className="legal-doc-nav" aria-label="Legal pages">
          <Link href="/privacy" aria-current={current === "privacy" ? "page" : undefined}>Privacy Policy</Link>
          <Link href="/terms" aria-current={current === "terms" ? "page" : undefined}>Terms of Use</Link>
          <Link href="/privacy#analytics-settings">Analytics choices</Link>
        </nav>
        <div className="legal-content">{children}</div>
        <div className="legal-actions">
          <Link className="button button-small" href="/">
            Return home
          </Link>
          <a className="text-link" href="mailto:info@orbisy.com">
            info@orbisy.com
          </a>
        </div>
      </div>
      </main>
      <PublicFooter />
    </>
  );
}
