"use client";

import { useEffect, useRef, useState } from "react";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { CheckCircle2 } from "lucide-react";
import {
  trackEvent,
  captureInquiryAttribution,
  type AnalyticsEventName,
} from "@/components/analytics-provider";

type FormType = "homepage-review" | "project-request";
type FormState = {
  status: "idle" | "submitting" | "success" | "error";
  message?: string;
  fields?: Record<string, string[]>;
};

export function PublicForm({
  type,
  service,
}: {
  type: FormType;
  service?: string;
}) {
  const submissionToken = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [started, setStarted] = useState(false);
  const [challengeVersion, setChallengeVersion] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState("");
  const prefix =
    type === "homepage-review" ? "homepage_review" : "project_request";

  function eventName(suffix: string) {
    return `${prefix}_form_${suffix}` as AnalyticsEventName;
  }

  useEffect(() => {
    trackEvent(eventName("view"));
    // Each form component is mounted only once on the landing page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setState({
        status: "error",
        message:
          "Please wait for spam protection to verify the form, then retry.",
      });
      return;
    }
    setState({ status: "submitting" });

    submissionToken.current ??= crypto.randomUUID();
    const data = {
      ...Object.fromEntries(new FormData(formRef.current)),
      submissionToken: submissionToken.current,
      attribution: captureInquiryAttribution(),
    };

    try {
      const response = await fetch(`/api/submissions/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = (await response.json()) as {
        message?: string;
        saved?: boolean;
        duplicate?: boolean;
        fields?: Record<string, string[]>;
      };

      if (!response.ok) {
        trackEvent(eventName("validation_error"));
        setState({
          status: "error",
          fields: result.fields,
          message:
            result.message ?? "Please review your information and try again.",
        });
        setTurnstileToken("");
        setChallengeVersion((v) => v + 1);
        return;
      }

      if (result.saved !== true)
        throw new Error("Submission was not confirmed saved");
      if (!result.duplicate) trackEvent(eventName("submit_success"));
      submissionToken.current = null;
      setState({ status: "success", message: result.message });
      formRef.current.reset();
    } catch {
      setTurnstileToken("");
      setChallengeVersion((v) => v + 1);
      setState({
        status: "error",
        message:
          "The form is unavailable right now. Please email info@orbisy.com.",
      });
    }
  }

  function markStarted() {
    if (started) return;
    setStarted(true);
    trackEvent(eventName("start"));
  }

  if (state.status === "success") {
    return (
      <div className="form-card form-success" role="status">
        <CheckCircle2 size={34} />
        <h3>Request received</h3>
        <p>{state.message}</p>
        <button
          className="text-link"
          onClick={() => {
            setTurnstileToken("");
            setChallengeVersion((v) => v + 1);
            setState({ status: "idle" });
          }}
        >
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form
      className="form-card"
      ref={formRef}
      onSubmit={submit}
      onFocus={markStarted}
      aria-describedby={`${type}-privacy`}
    >
      <div className="form-grid">
        <label>
          <span>Name</span>
          <input
            aria-invalid={Boolean(state.fields?.name)}
            name="name"
            autoComplete="name"
            maxLength={100}
            required
          />
        </label>
        <label>
          <span>Business name</span>
          <input
            aria-invalid={Boolean(state.fields?.businessName)}
            name="businessName"
            autoComplete="organization"
            maxLength={160}
            required
          />
        </label>
        <label>
          <span>Email</span>
          <input
            aria-invalid={Boolean(state.fields?.email)}
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
          />
        </label>
        <label>
          <span>
            Website URL <em>optional</em>
          </span>
          <input
            aria-invalid={Boolean(state.fields?.websiteUrl)}
            name="websiteUrl"
            type="url"
            placeholder="https://"
            maxLength={500}
          />
        </label>

        {type === "homepage-review" ? (
          <>
            <label className="full-field">
              <span>Primary business goal</span>
              <input
                name="primaryGoal"
                maxLength={200}
                required
                placeholder="What should your website help accomplish?"
              />
            </label>
            <label className="full-field">
              <span>Biggest website concern</span>
              <textarea
                name="websiteConcern"
                maxLength={1500}
                required
                rows={4}
                placeholder="What feels unclear, slow, difficult, or incomplete?"
              />
            </label>
          </>
        ) : (
          <>
            <label className="full-field">
              <span>Service needed</span>
              <select
                aria-invalid={Boolean(state.fields?.serviceNeeded)}
                name="serviceNeeded"
                required
                defaultValue={service ?? ""}
              >
                <option value="" disabled>
                  Select a service
                </option>
                <option>Website design or redesign</option>
                <option>Google Ads / PPC management</option>
                <option>Local SEO</option>
                <option>Custom development or integrations</option>
                <option>Website and marketing package</option>
                <option>Not sure yet</option>
              </select>
            </label>
            <label className="full-field">
              <span>What would you like help with?</span>
              <textarea
                aria-invalid={Boolean(state.fields?.projectDescription)}
                name="projectDescription"
                maxLength={3000}
                required
                rows={4}
                placeholder="Tell us about your business, your goals, and what you want to improve."
              />
            </label>
            <details className="form-options">
              <summary>Budget and timing (optional)</summary>
              <div className="form-grid">
                <label>
                  <span>
                    Timeline <em>optional</em>
                  </span>
                  <input
                    name="timeline"
                    maxLength={80}
                    placeholder="For example, within 30 days"
                  />
                </label>
                <label>
                  <span>
                    Budget range <em>optional</em>
                  </span>
                  <select name="budgetRange" defaultValue="">
                    <option value="">Select a range</option>
                    <option>Under $1,500</option>
                    <option>$1,500–$3,000</option>
                    <option>$3,000–$5,000</option>
                    <option>$5,000–$10,000</option>
                    <option>$10,000+</option>
                    <option>Not sure yet</option>
                  </select>
                </label>
              </div>
            </details>
          </>
        )}
      </div>

      <label className="honeypot" aria-hidden="true">
        Company website verification
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <TurnstileWidget
          key={challengeVersion}
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          onToken={setTurnstileToken}
        />
      )}
      <input
        name="turnstileToken"
        type="hidden"
        value={turnstileToken}
        readOnly
      />

      <label className="consent-row">
        <input name="consent" type="checkbox" required />
        <span id={`${type}-privacy`}>
          I understand Orbisy will use this information to review and respond to
          my request, as described in the <a href="/privacy">Privacy Policy</a>.
          Submitting this form does not create a client relationship.
        </span>
      </label>

      {state.status === "error" && (
        <p className="form-message form-error" role="alert">
          {state.message}
          {state.fields &&
            Object.entries(state.fields).map(([field, errors]) => (
              <span className="field-error" key={field}>
                {field}: {errors.join(" ")}
              </span>
            ))}
        </p>
      )}

      <button
        className="button submit-button"
        type="submit"
        disabled={state.status === "submitting"}
      >
        {state.status === "submitting"
          ? "Sending…"
          : type === "homepage-review"
            ? "Request my review"
            : "Request a consultation"}
      </button>
      <p className="form-footnote">
        Anthony reviews your request and replies by email to arrange the next
        step.
      </p>
    </form>
  );
}
