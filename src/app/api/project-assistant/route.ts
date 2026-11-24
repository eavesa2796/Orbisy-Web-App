import { NextResponse } from "next/server";
import { z } from "zod";
import { getAssistantPassages, findAssistantSources } from "@/lib/project-assistant-knowledge";
import { checkGlobalRateLimit, checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 15;

const requestSchema = z.object({
  message: z.string().trim().min(1).max(800),
  pagePath: z.string().max(140).regex(/^\/[a-z0-9\-/#]*$/i).optional().default(""),
}).strict();

function handoffResponse() {
  return {
    answer: "I couldn’t find a reliable answer in Orbisy’s published pages. Share your goal and current systems in the project request form, and Orbisy can review the details. Please keep passwords, API keys, and confidential member information out of this chat.",
    sources: [],
    handoff: true,
  };
}

function isHumanRequest(message: string) {
  return /\b(custom|fixed|exact)\s+(quote|price|estimate)\b|\b(talk|speak|meet|call|email)\s+(to|with)\s+(a\s+)?(person|human|developer|orbisy)\b|\bwhat would .{0,50} cost for us\b|\bcan you build (our|a custom)\b|\b(can|will|does|could)\b.{0,90}\b(integrate|connect|sync|sso)\b/i.test(message);
}

function excerpt(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= 700) return normalized;
  const candidate = normalized.slice(0, 700);
  const lastSentence = Math.max(candidate.lastIndexOf(". "), candidate.lastIndexOf("? "), candidate.lastIndexOf("! "));
  return candidate.slice(0, lastSentence > 350 ? lastSentence + 1 : 697).trimEnd() + (lastSentence > 350 ? "" : "…");
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin)
        return NextResponse.json({ error: "This request is not allowed." }, { status: 403, headers: { "Cache-Control": "no-store" } });
    } catch {
      return NextResponse.json({ error: "This request is not allowed." }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 2_000)
    return NextResponse.json({ error: "This message is too long." }, { status: 413, headers: { "Cache-Control": "no-store" } });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Please send a valid message." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success)
    return NextResponse.json({ error: "Please shorten your message and try again." }, { status: 400, headers: { "Cache-Control": "no-store" } });

  try {
    const visitorAllowed = await checkRateLimit(request, {
      namespace: "public-project-assistant",
      limit: 12,
      windowSeconds: 3600,
    });
    if (!visitorAllowed)
      return NextResponse.json({ error: "You’ve reached the chat limit for now. Please use the project request form." }, { status: 429, headers: { "Cache-Control": "no-store" } });

    const dailyAllowed = await checkGlobalRateLimit("public-project-assistant", 75, 86_400);
    if (!dailyAllowed)
      return NextResponse.json({ error: "The assistant is taking a break for today. Please use the project request form." }, { status: 429, headers: { "Cache-Control": "no-store" } });

    const passages = await getAssistantPassages();
    const matches = findAssistantSources(passages, parsed.data.message, parsed.data.pagePath);
    if (isHumanRequest(parsed.data.message) || matches.length === 0 || matches[0].score < 3)
      return NextResponse.json(handoffResponse(), { headers: { "Cache-Control": "no-store" } });

    const selected = matches.slice(0, 2);
    const sources = [...new Map(selected.map(({ passage }) => [
      passage.source,
      { title: passage.title, href: passage.source },
    ])).values()];
    const answers = selected.map(({ passage }) => {
      let text = passage.text;
      const firstLine = text.indexOf("\n");
      if (passage.title.includes(": ") && firstLine > -1 && text.slice(0, firstLine).trim().endsWith("?"))
        text = text.slice(firstLine + 1);
      return excerpt(text);
    }).filter(Boolean);

    return NextResponse.json({
      answer: "Here’s the most relevant information from Orbisy’s public pages:\n\n" + answers.join("\n\n"),
      sources,
      handoff: false,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({
      answer: "The assistant is temporarily unavailable. Please use the project request form or email info@orbisy.com.",
      sources: [],
      handoff: true,
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
