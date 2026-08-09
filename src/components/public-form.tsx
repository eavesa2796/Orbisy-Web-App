"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { trackEvent, type AnalyticsEventName } from "@/components/analytics-provider";

export type PublicFormType = "hauler-request" | "restaurant-request" | "general-request";
type FormState = { status: "idle" | "submitting" | "success" | "error"; message?: string };

const formCopy = {
  "hauler-request": {
    submit: "Request a workflow review",
    challenge: "What is hardest about managing or delivering customer service records?",
    placeholder: "For example: old-ticket requests, inconsistent driver evidence, or records spread across systems",
  },
  "restaurant-request": {
    submit: "Request a records review",
    challenge: "What is hardest about retrieving or maintaining your service records?",
    placeholder: "For example: missing tickets, multiple locations, vendor changes, or an upcoming inspection",
  },
  "general-request": {
    submit: "Start a conversation",
    challenge: "What records workflow are you trying to improve?",
    placeholder: "Briefly describe the current process and where records become difficult to retrieve",
  },
} as const;

export function PublicForm({ type }: { type: PublicFormType }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [started, setStarted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const prefix = type.replaceAll("-", "_");
  const copy = formCopy[type];

  function eventName(suffix: string) {
    return `${prefix}_form_${suffix}` as AnalyticsEventName;
  }

  useEffect(() => {
    trackEvent(eventName("view"));
    // Each form component is mounted only once on its landing page.
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
        setState({ status: "error", message: result.message ?? "Please review your information and try again." });
        return;
      }
      trackEvent(eventName("submit_success"));
      setState({ status: "success", message: result.message });
      formRef.current.reset();
    } catch {
      setState({ status: "error", message: "The form is unavailable right now. Please call (224) 323-6231 or email info@orbisy.com." });
    }
  }

  if (state.status === "success") {
    return <div className="form-card form-success" role="status"><CheckCircle2 size={34} /><h3>Request received</h3><p>{state.message}</p><button className="text-link" onClick={() => setState({ status: "idle" })}>Send another request</button></div>;
  }

  return (
    <form className="form-card" ref={formRef} onSubmit={submit} onFocus={() => { if (!started) { setStarted(true); trackEvent(eventName("start")); } }} aria-describedby={`${type}-privacy`}>
      <input type="hidden" name="audience" value={type.replace("-request", "")} />
      <div className="form-grid">
        <label><span>Name</span><input name="name" autoComplete="name" maxLength={100} required /></label>
        <label><span>Business name</span><input name="businessName" autoComplete="organization" maxLength={160} required /></label>
        <label><span>Work email</span><input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
        <label><span>Phone</span><input name="phone" type="tel" autoComplete="tel" maxLength={40} required /></label>
        <label><span>Your role</span><input name="role" maxLength={100} placeholder="Owner, operations manager, dispatcher…" required /></label>
        <label><span>Service territory</span><input name="serviceArea" maxLength={200} placeholder={type === "restaurant-request" ? "Cities or states where your locations operate" : "Cities, counties, or states served"} required /></label>
        <label><span>{type === "restaurant-request" ? "Number of restaurant locations" : "Approximate restaurant accounts"}</span><select name="locationCount" required defaultValue=""><option value="" disabled>Select a range</option><option>1–10</option><option>11–50</option><option>51–150</option><option>151–300</option><option>301–1,000</option><option>1,000+</option><option>Not sure</option></select></label>
        <label><span>Current record process</span><select name="currentRecordProcess" required defaultValue=""><option value="" disabled>Select the closest match</option><option>Mostly paper tickets</option><option>Email and PDF files</option><option>Spreadsheets and shared folders</option><option>Existing field-service software</option><option>Several disconnected systems</option><option>Not sure</option></select></label>
        <label className="full-field"><span>{copy.challenge}</span><textarea name="primaryChallenge" maxLength={3000} required rows={4} placeholder={copy.placeholder} /></label>
        <label className="full-field"><span>Pilot interest</span><select name="pilotInterest" required defaultValue=""><option value="" disabled>Select one</option><option>Ready to discuss a small pilot</option><option>Interested, but need more information</option><option>Researching options for later</option></select></label>
      </div>
      <label className="honeypot" aria-hidden="true">Company website verification<input name="company" tabIndex={-1} autoComplete="off" /></label>
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" /><div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} data-callback={`orbisyTurnstile_${prefix}`} /><input name="turnstileToken" type="hidden" value={turnstileToken} readOnly /><Script id={`turnstile-callback-${type}`} strategy="afterInteractive">{`window.orbisyTurnstile_${prefix} = function(token) { window.dispatchEvent(new CustomEvent("${type}-turnstile", { detail: token })); };`}</Script><TurnstileListener type={type} onToken={setTurnstileToken} /></>}
      <label className="consent-row"><input name="consent" type="checkbox" required /><span id={`${type}-privacy`}>I understand Orbisy will use this information to review and respond to my request, as described in the <a href="/privacy">Privacy Policy</a>. Submitting this form does not create a client relationship.</span></label>
      {state.status === "error" && <p className="form-message form-error" role="alert">{state.message}</p>}
      <button className="button submit-button" type="submit" disabled={state.status === "submitting"}>{state.status === "submitting" ? "Sending…" : copy.submit}{state.status !== "submitting" && <ArrowRight size={18} />}</button>
      <p className="form-footnote">Typical response times are within two business days.</p>
    </form>
  );
}

function TurnstileListener({ type, onToken }: { type: PublicFormType; onToken: (token: string) => void }) {
  useEffect(() => {
    const eventName = `${type}-turnstile`;
    const listener = (event: Event) => onToken((event as CustomEvent<string>).detail);
    window.addEventListener(eventName, listener);
    return () => window.removeEventListener(eventName, listener);
  }, [onToken, type]);
  return null;
}
