"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X } from "lucide-react";
import "./project-assistant.css";

type Source = { title: string; href: string };
type Turn = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  handoff?: boolean;
};
type ApiResult = { answer?: string; sources?: Source[]; handoff?: boolean; error?: string };

const starters = [
  "What kind of project could fit our association?",
  "How do the project price ranges work?",
  "What should we know before connecting our systems?",
];

export function ProjectAssistant() {
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Turn[]>([
    {
      role: "assistant",
      content: "Hi, I can help you explore Orbisy’s services, project planning ranges, and what a scoped project involves. Ask me a question and I’ll point you to the relevant page.",
    },
  ]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function closePanel() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, busy]);

  async function send(value = draft) {
    const question = value.trim();
    if (!question || busy) return;
      const nextMessages: Turn[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setDraft("");
    setBusy(true);
    try {
      const response = await fetch("/api/project-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          pagePath: pathname,
        }),
      });
      const result = await response.json() as ApiResult;
      if (!response.ok) {
        setMessages((current) => [...current, {
          role: "assistant",
          content: result.error ?? "The assistant is temporarily unavailable. Please use the project request form.",
          handoff: true,
        }]);
      } else {
        setMessages((current) => [...current, {
          role: "assistant",
          content: result.answer ?? "I can’t confirm that from the public site.",
          sources: result.sources ?? [],
          handoff: result.handoff === true,
        }]);
      }
    } catch {
      setMessages((current) => [...current, {
        role: "assistant",
        content: "The assistant is temporarily unavailable. Please use the project request form or email info@orbisy.com.",
        handoff: true,
      }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="project-assistant">
      {open && (
        <section
          className="project-assistant-panel"
          onKeyDown={(event) => {
            if (event.key === "Escape") closePanel();
          }}
          role="dialog"
          aria-modal="false"
          aria-labelledby="project-assistant-title"
          aria-describedby="project-assistant-disclosure"
        >
          <header className="project-assistant-header">
            <div>
              <p className="eyebrow">Orbisy project assistant</p>
              <h2 id="project-assistant-title">Find a useful next step.</h2>
            </div>
            <button type="button" className="project-assistant-close" onClick={closePanel} aria-label="Close project assistant">
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="project-assistant-messages" aria-live="polite" aria-relevant="additions text">
            {messages.map((message, index) => (
              <article className={"project-assistant-message " + message.role} key={index}>
                <p>{message.content}</p>
                {message.sources && message.sources.length > 0 && (
                  <div className="project-assistant-sources" aria-label="Sources">
                    {message.sources.map((source) => (
                      <Link href={source.href} key={source.href} onClick={closePanel}>
                        Read: {source.title}
                      </Link>
                    ))}
                  </div>
                )}
                {message.handoff && (
                  <div className="project-assistant-handoff">
                    <Link className="button" href="/pricing#contact" onClick={closePanel}>
                      Discuss your project
                    </Link>
                    <a href="mailto:info@orbisy.com">Email Orbisy</a>
                  </div>
                )}
              </article>
            ))}
            {messages.length === 1 && !busy && (
              <div className="project-assistant-starters" aria-label="Suggested questions">
                {starters.map((starter) => (
                  <button type="button" key={starter} onClick={() => void send(starter)}>
                    {starter}
                  </button>
                ))}
              </div>
            )}
            {busy && <p className="project-assistant-loading" role="status">Checking Orbisy’s public pages…</p>}
            <div ref={endRef} />
          </div>

          <form
            className="project-assistant-form"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <label className="sr-only" htmlFor="project-assistant-input">Ask a question about working with Orbisy</label>
            <textarea
              ref={inputRef}
              id="project-assistant-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about services, scope, or planning…"
              maxLength={800}
              rows={2}
              disabled={busy}
            />
            <button type="submit" aria-label="Send question" disabled={busy || !draft.trim()}>
              <Send size={17} aria-hidden="true" />
            </button>
          </form>

          <p id="project-assistant-disclosure" className="project-assistant-disclosure">
            Answers are matched to Orbisy’s public pages. Don’t share passwords, API keys, or confidential member data. <Link href="/privacy">Privacy</Link>
          </p>
        </section>
      )}
      <button
        ref={triggerRef}
        type="button"
        className="project-assistant-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => { if (open) closePanel(); else setOpen(true); }}
      >
        {open ? <X size={18} aria-hidden="true" /> : <MessageCircle size={18} aria-hidden="true" />}
        <span>{open ? "Close" : "Ask Orbisy"}</span>
      </button>
    </div>
  );
}
