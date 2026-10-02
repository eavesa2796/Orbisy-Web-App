import { Check } from "lucide-react";
import { PublicForm } from "@/components/public-form";

export function AgencyContact({
  title = "Let’s talk about your next step.",
  description = "Tell us what your business does and what you want to improve. Anthony will review your request and help determine whether Orbisy is a good fit.",
}: {
  title?: string;
  description?: string;
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
              Start with your goals and priorities
            </li>
            <li>
              <Check size={17} aria-hidden="true" />
              Agree on a scope before paid work begins
            </li>
            <li>
              <Check size={17} aria-hidden="true" />
              Choose a project or ongoing support
            </li>
          </ul>
          <p className="agency-contact-email">
            Prefer email? <a href="mailto:info@orbisy.com">info@orbisy.com</a>
          </p>
        </div>
        <PublicForm type="project-request" />
      </div>
    </section>
  );
}
