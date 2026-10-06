import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms governing use of the Orbisy website.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalLayout kicker="Last updated: August 5, 2026 · Draft—legal review required" title="Terms of Use">
      <p>
        These draft terms govern use of the public Orbisy website. They require
        owner and legal review before publication.
      </p>

      <h2>Informational purpose</h2>
      <p>
        Website content and preliminary records-workflow discussions are
        provided for general informational purposes. They are not legal,
        regulatory, security, accounting, or compliance advice or certification.
      </p>

      <h2>No client relationship</h2>
      <p>
        Visiting the site, submitting a form, or receiving a preliminary
        response does not create a client, fiduciary, confidential, or other
        professional relationship. A project begins only through a separately
        accepted written agreement. Customer confirmation and authorization are
        required before Orbisy performs records work or contacts another party.
      </p>

      <h2>No guaranteed outcomes</h2>
      <p>
        Orbisy does not certify compliance or guarantee inspection results,
        municipal acceptance, service quality, record completeness, savings,
        fine avoidance, or any other business or regulatory result. Any review
        is limited to available customer-supplied information and may be incomplete.
      </p>

      <h2>Service boundaries</h2>
      <p>
        Orbisy organizes grease-interceptor service records as a managed
        records service. Orbisy does not pump or clean interceptors, perform
        physical inspections, replace a grease hauler, certify a hauler&apos;s work,
        or provide legal or regulatory advice. The public website is not a
        customer portal and does not accept grease-service document uploads.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You may not misuse the site, attempt unauthorized access, disrupt its
        operation, submit unlawful or malicious content, impersonate another
        person, or use the forms to send spam.
      </p>

      <h2>Intellectual property</h2>
      <p>
        Orbisy&apos;s original site content and design remain protected by
        applicable intellectual-property laws.
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
        <strong>Legal-review placeholder:</strong> appropriate warranty
        disclaimers, limitations of liability, governing law, venue, dispute
        procedures, retention and incident terms, and severability language
        must be added or approved by the owner and qualified counsel before
        expanded service delivery.
      </p>

      <h2>Contact</h2>
      <p>Questions about these terms may be sent to info@orbisy.com.</p>
    </LegalLayout>
  );
}
