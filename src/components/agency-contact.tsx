import { Check } from "lucide-react";
import { PublicForm } from "@/components/public-form";

export function AgencyContact({
  title = "Request a consultation.",
  service,
  description = "Tell us what your business does and what you want to improve. Anthony will review your request and help determine whether Orbisy is a good fit.",
}: {
  title?: string;
  description?: string;
  service?: string;
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
              Anthony reviews your business and goals
            </li>
            <li>
              <Check size={17} aria-hidden="true" />
              He replies by email to arrange a conversation
            </li>
            <li>
              <Check size={17} aria-hidden="true" />
              You receive a proposed next step; paid work needs an agreed scope
            </li>
          </ul>
          <p className="agency-contact-email">
            Prefer email? <a href="mailto:info@orbisy.com">info@orbisy.com</a>
          </p>
        </div>
        <PublicForm type="project-request" service={service} />
      </div>
    </section>
  );
}
