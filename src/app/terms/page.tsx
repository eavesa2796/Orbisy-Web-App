import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms for using Orbisy LLC’s website, submitting inquiries, and establishing a separate agreement for development services.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalLayout kicker="Last updated: November 16, 2026" title="Terms of Use" current="terms">
    <p>These terms describe use of orbisy.com, the public website of Orbisy LLC, an independent development business based in Chicago, Illinois. Questions can be sent to <a href="mailto:info@orbisy.com">info@orbisy.com</a>.</p>
    <h2>Website information</h2>
    <p>The website explains Orbisy’s services, approach, and selected work. General descriptions, example features, and estimates help start a conversation; they are not an accepted project scope or a promise that every feature is available for every organization. Content may change as services and examples are updated.</p>
    <h2>Commissioning a project</h2>
    <p>Submitting an inquiry or arranging a consultation does not by itself create a paid engagement. Before work begins, Orbisy and the client agree separately in writing on the scope, deliverables, fees, timing, responsibilities, and any ongoing support. The accepted project agreement governs that work. Changes to these website terms do not change an existing project agreement.</p>
    <p>Websites, member functionality, integrations, and staff tools are services that can be commissioned. Proposed capabilities are not existing off-the-shelf Orbisy products. Maintenance, additional development, and larger projects need an agreed scope; a general service description does not promise unlimited work or continuous support.</p>
    <h2>Existing systems and integrations</h2>
    <p>Integration feasibility depends on the particular platform, available APIs, permissions, vendor requirements, and authorized account access. A proposed connection, synchronization, or single sign-on feature needs review before it becomes a committed deliverable. Familiarity with a platform does not imply a formal partnership, certification, or endorsement by its vendor.</p>
    <h2>Information you submit</h2>
    <p>Provide accurate contact details and only information you are authorized to share. Orbisy uses project inquiries to review your request, communicate with you, and discuss suitable next steps, as described in the <Link href="/privacy">Privacy Policy</Link>.</p>
    <p>Do not send passwords, API keys, payment details, or confidential member records through the public inquiry form. If a project requires access or materials, the transfer method and responsibilities are agreed separately.</p>
    <h2>Acceptable use and private access</h2>
    <p>Use the site lawfully. Do not submit spam or malicious material, attempt unauthorized access, disrupt services, or use another person’s credentials. Private administration tools are for authorized users. Access to the public website does not grant access to those tools or their records.</p>
    <h2>Website and portfolio materials</h2>
    <p>Orbisy’s branding, original website content, and design materials are protected by applicable intellectual property rights. Third-party names, logos, screenshots, and project materials belong to their respective owners. Their appearance identifies an example or platform and does not imply an endorsement.</p>
    <p>You may view and share links to the public site. Reuse of protected materials requires the relevant owner’s permission or another lawful basis. Ownership and licensing of commissioned deliverables are addressed in the applicable project agreement.</p>
    <h2>Third-party sites and services</h2>
    <p>Links and embedded security or reporting services may involve third-party providers. Those providers have their own terms and privacy practices. Orbisy does not control external websites, vendor availability, or changes to vendor platforms. Any responsibilities for third-party services in a client project are addressed in that project’s agreement.</p>
    <h2>Examples, outcomes, and availability</h2>
    <p>Portfolio work illustrates design and development experience; concepts are identified as concepts. An example is not a guarantee of membership growth, revenue, search position, or another business result. Reviews and proposed recommendations depend on the information and access available at the time.</p>
    <p>Orbisy aims to keep website information useful and available, but pages can contain errors or be temporarily unavailable. Contact us about an error. Any agreed project testing, acceptance criteria, warranties, and support commitments belong in the written project agreement.</p>
    <h2>Privacy and analytics choices</h2>
    <p>The <Link href="/privacy">Privacy Policy</Link> explains inquiries, reporting, service providers, browser storage, and privacy requests. You can review or change optional reporting preferences through <Link href="/privacy#analytics-settings">analytics choices</Link>. Declining optional analytics does not prevent submitting a project inquiry.</p>
    <h2>Updates and questions</h2>
    <p>The date above identifies this revision. Updates apply to subsequent use of the public website and do not replace separately accepted client agreements. Contact <a href="mailto:info@orbisy.com">info@orbisy.com</a> if you need clarification before sharing project information or commissioning work.</p>
  </LegalLayout>;
}
