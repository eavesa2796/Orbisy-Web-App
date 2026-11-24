"use client";

import {useRef, useState, type FormEvent} from "react";
import {getGmailAuthorizationUrl} from "@/lib/followups/connect-client";

export function GmailConnectForm({outreach = false}: {outreach?: boolean}) {
  const path = outreach ? "/api/admin/outreach/gmail/start" : "/api/admin/followups/gmail/start";
  const inFlight = useRef(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setConnecting(true);
    setError("");
    try {
      const url = await getGmailAuthorizationUrl(path);
      // A normal navigation also works after Next's client-side navigation,
      // where the document may retain another admin page's form-action policy.
      window.location.assign(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gmail could not be opened. Try again.");
      inFlight.current = false;
      setConnecting(false);
    }
  }

  return <form action={path} method="post" onSubmit={connect} aria-busy={connecting}>
    <button type="submit" className="button button-secondary" disabled={connecting}>
      {connecting ? "Opening Google…" : outreach ? "Connect outreach sending with Google" : "Connect info@orbisy.com with Google"}
    </button>
    {error && <p className="notice error-text" role="alert">{error}</p>}
  </form>;
}
