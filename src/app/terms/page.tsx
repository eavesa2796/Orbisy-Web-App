import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms governing use of the Orbisy website.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalLayout kicker="Last updated: July 30, 2026" title="Terms of Use">
      <p>
        These draft terms govern use of the public Orbisy website. They require
        owner and legal review before publication.
      </p>

      <h2>Informational purpose</h2>
      <p>
        Website content and complimentary homepage observations are provided
        for general informational discussion. They are not legal, security,
        accessibility, accounting, or SEO advice or certification.
      </p>

      <h2>No client relationship</h2>
      <p>
        Visiting the site, submitting a form, or receiving a preliminary
        response does not create a client, fiduciary, confidential, or other
        professional relationship. A project begins only through a separately
        accepted written agreement.
      </p>

      <h2>No guaranteed outcomes</h2>
      <p>
        Orbisy does not guarantee search rankings, traffic, leads, conversions,
        revenue, savings, uptime, or any other business result. Website
        observations are limited, point-in-time impressions and may be
        incomplete.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You may not misuse the site, attempt unauthorized access, disrupt its
        operation, submit unlawful or malicious content, impersonate another
        person, or use the forms to send spam.
      </p>

      <h2>Intellectual property</h2>
      <p>
        Orbisy&apos;s original site content, design, and concept-project
        materials remain protected by applicable intellectual-property laws.
        Third-party names and marks remain the property of their owners.
      </p>

      <h2>Third-party services and links</h2>
      <p>
        The site may depend on or link to third-party services with separate
        terms and privacy practices. Orbisy is not responsible for third-party
        availability or content.
      </p>

      <h2>Disclaimer and limitation placeholders</h2>
      <p>
        Appropriate warranty disclaimers, limitations of liability, governing
        law, venue, dispute procedures, and severability language must be added
        or approved by qualified counsel before launch.
      </p>

      <h2>Contact</h2>
      <p>Questions about these terms may be sent to info@orbisy.com.</p>
    </LegalLayout>
  );
}
