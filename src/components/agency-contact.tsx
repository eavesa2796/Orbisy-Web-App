import { Check } from "lucide-react";
import { PublicForm } from "@/components/public-form";

export function AgencyContact({
  title = "Discuss your project.",
  service,
  inquiryContext,
  description = "Tell us about your association, the systems you use, and the problem you want to solve. Orbisy will review the details and reply by email to arrange a conversation.",
}: {
  title?: string;
  description?: string;
  service?: string;
  inquiryContext?: string;
}) {
  return (
    <section className="section review-section" id="contact">
      <div className="container review-layout">
        <div className="form-intro">
          <p className="eyebrow">
            <span />
            Start a conversation
          </p>
          <h2>{title}</h2>
          <p>{description}</p>
          <ul>
            <li>
              <Check size={17} aria-hidden="true" />
              Orbisy reviews your goals and existing systems
            </li>
            <li>
              <Check size={17} aria-hidden="true" />
              You receive an email to arrange a conversation
            </li>
            <li>
              <Check size={17} aria-hidden="true" />
              A proposed next step and written scope come before paid work
            </li>
          </ul>
          <p className="agency-contact-email">
            Prefer email? <a href="mailto:info@orbisy.com">info@orbisy.com</a>
          </p>
        </div>
        <PublicForm
          type="project-request"
          service={service}
          inquiryContext={inquiryContext}
        />
      </div>
    </section>
  );
}
