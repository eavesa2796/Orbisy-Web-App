"use client";
import { useEffect, useRef } from "react";
import Script from "next/script";
type Turnstile = {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      theme: string;
      size: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ): string;
  remove(id: string): void;
};
export function TurnstileWidget({
  siteKey,
  onToken,
}: {
  siteKey: string;
  onToken: (token: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    widget = useRef<string | null>(null);
  function renderWidget() {
    const api = (window as Window & { turnstile?: Turnstile }).turnstile;
    if (!api || !container.current || widget.current !== null) return;
    widget.current = api.render(container.current, {
      sitekey: siteKey,
      theme: "dark",
      size: "flexible",
      callback: onToken,
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    });
  }
  useEffect(
    () => () => {
      const api = (window as Window & { turnstile?: Turnstile }).turnstile;
      if (widget.current !== null) api?.remove(widget.current);
      widget.current = null;
    },
    [],
  );
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div ref={container} className="turnstile-container" />
    </>
  );
}
