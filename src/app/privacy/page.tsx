import type { Metadata } from "next";
import { AnalyticsChoice } from "@/components/analytics-choice";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Orbisy collects and uses information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalLayout kicker="Last updated: July 30, 2026" title="Privacy Policy">
      <p>
        This draft explains the information Orbisy expects to process through
        its public website and private lead-management tools.
      </p>

      <h2>Information you provide</h2>
      <p>
        When you request a homepage review or submit a project request, Orbisy
        may collect your name, business name, email address, website URL,
        business goal, website concern, requested service, project description,
        timeline, budget range, and acknowledgment of this policy.
      </p>

      <h2>Business lead information</h2>
      <p>
        The private administrator system may contain business contact
        information entered manually from documented public or otherwise
        permitted sources or imported through administrator-reviewed CSV files.
        Orbisy records source attribution and may retain the original imported
        value alongside a normalized value used for duplicate and suppression
        checks. Imported information may be incomplete, outdated, or inaccurate.
        It may also contain notes, follow-up dates, pipeline history, suppression
        choices, and manually recorded contact attempts.
      </p>

      <h2>Anonymous website analytics</h2>
      <p>
        Orbisy uses first-party analytics to understand page views, calls to
        action, form starts, successful submissions, referring domains, broad
        device categories, and aggregate website journeys. These events use a
        random session identifier and are not connected to form submissions.
        Orbisy does not intentionally store raw IP addresses, full user-agent
        strings, exact location, advertising identifiers, fingerprints, or form
        contents as analytics.
      </p>
      <AnalyticsChoice />

      <h2>How information is used</h2>
      <ul>
        <li>Review and respond to requests.</li>
        <li>Manage legitimate business conversations and follow-ups.</li>
        <li>Protect forms and administrator access from abuse.</li>
        <li>Understand and improve the public website.</li>
        <li>Maintain suppression records to avoid unwanted contact.</li>
      </ul>

      <h2>Service providers</h2>
      <p>
        Orbisy may use providers for hosting, PostgreSQL database services,
        administrator authentication, spam prevention, error monitoring, and
        optional transactional notifications. Final providers and their
        processing locations must be confirmed before launch.
      </p>

      <h2>Retention and deletion</h2>
      <p>
        Raw anonymous analytics are intended to be retained for approximately
        90 days. Other business records are retained only while reasonably
        useful for the stated purposes or required for legitimate operational,
        legal, security, or accounting needs. Backup deletion may be delayed
        until the relevant backup expires. A minimal suppression record may be
        retained without automatic expiration to prevent renewed contact.
      </p>

      <h2>Security and limitations</h2>
      <p>
        Orbisy uses reasonable technical and organizational safeguards, but no
        online service can promise absolute security. Production backup,
        incident-response, vendor, and retention procedures must be confirmed
        before launch.
      </p>

      <h2>Your choices</h2>
      <p>
        You may ask to access, correct, delete, or suppress information by
        contacting info@orbisy.com. Requests may require reasonable
        verification.
      </p>

      <h2>Changes</h2>
      <p>
        This policy may be updated as Orbisy&apos;s services and providers
        change. The effective date and policy version should be updated whenever
        material terms change.
      </p>
    </LegalLayout>
  );
}
