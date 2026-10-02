"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  trackEvent,
  type AnalyticsEventName,
} from "@/components/analytics-provider";

type FormType = "homepage-review" | "project-request";
type FormState = {
  status: "idle" | "submitting" | "success" | "error";
  message?: string;
};

export function PublicForm({ type }: { type: FormType }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [started, setStarted] = useState(false);
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
    setState({ status: "submitting" });

    const data = Object.fromEntries(new FormData(formRef.current));
    data.submissionToken = crypto.randomUUID();

    try {
      const response = await fetch(`/api/submissions/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        trackEvent(eventName("validation_error"));
        setState({
          status: "error",
          message:
            result.message ?? "Please review your information and try again.",
        });
        return;
      }

      trackEvent(eventName("submit_success"));
      setState({ status: "success", message: result.message });
      formRef.current.reset();
    } catch {
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
          onClick={() => setState({ status: "idle" })}
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
          <input name="name" autoComplete="name" maxLength={100} required />
        </label>
        <label>
          <span>Business name</span>
          <input
            name="businessName"
            autoComplete="organization"
            maxLength={160}
            required
          />
        </label>
        <label>
          <span>Email</span>
          <input
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
              <select name="serviceNeeded" required defaultValue="">
                <option value="" disabled>
                  Select a service
                </option>
                <option>Restaurant records cleanup pilot</option>
                <option>Multi-location records management</option>
                <option>Grease-hauler customer-history pilot</option>
                <option>Property or facility records review</option>
                <option>Not sure yet</option>
              </select>
            </label>
            <label className="full-field">
              <span>Project description</span>
              <textarea
                name="projectDescription"
                maxLength={3000}
                required
                rows={4}
                placeholder="How are records stored today, and what is difficult to retrieve or confirm?"
              />
            </label>
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
          </>
        )}
      </div>

      <label className="honeypot" aria-hidden="true">
        Company website verification
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="afterInteractive"
          />
          <div
            className="cf-turnstile"
            data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            data-callback={`orbisyTurnstile_${type.replace("-", "_")}`}
          />
          <input name="turnstileToken" type="hidden" value={turnstileToken} readOnly />
          <Script id={`turnstile-callback-${type}`} strategy="afterInteractive">
            {`window.orbisyTurnstile_${type.replace("-", "_")} = function(token) {
              window.dispatchEvent(new CustomEvent("${type}-turnstile", { detail: token }));
            };`}
          </Script>
          <TurnstileListener type={type} onToken={setTurnstileToken} />
        </>
      )}

      <label className="consent-row">
        <input name="consent" type="checkbox" required />
        <span id={`${type}-privacy`}>
          I understand Orbisy will use this information to review and respond
          to my request, as described in the{" "}
          <a href="/privacy">Privacy Policy</a>. Submitting this form does not
          create a client relationship.
        </span>
      </label>

      {state.status === "error" && (
        <p className="form-message form-error" role="alert">
          {state.message}
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
            : "Request records review"}
        {state.status !== "submitting" && <ArrowRight size={18} />}
      </button>
      <p className="form-footnote">
        Anthony typically responds within two business days.
      </p>
    </form>
  );
}

function TurnstileListener({
  type,
  onToken,
}: {
  type: FormType;
  onToken: (token: string) => void;
}) {
  useEffect(() => {
    const eventName = `${type}-turnstile`;
    const listener = (event: Event) =>
      onToken((event as CustomEvent<string>).detail);
    window.addEventListener(eventName, listener);
    return () => window.removeEventListener(eventName, listener);
  }, [onToken, type]);
  return null;
}
