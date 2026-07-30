import type { ReactNode } from "react";
import Link from "next/link";

export function LegalLayout({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="legal-page" id="main-content">
      <div className="legal-shell">
        <Link className="wordmark" href="/">
          <span className="wordmark-orbit" />
          Orbisy
        </Link>
        <p className="legal-kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="legal-review-note">
          Draft for owner and legal review before launch. This page does not
          claim that Orbisy has completed a legal-compliance review.
        </p>
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
  );
}
