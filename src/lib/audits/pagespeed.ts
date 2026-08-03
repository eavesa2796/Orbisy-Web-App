import "server-only";

export type PerformanceResult = {
  provider: "google_pagespeed"; available: boolean; score: number | null;
  executionMs: number; errorClassification: string | null;
};

export async function inspectMobilePerformance(input: {
  url: string; enabled: boolean; apiKey?: string; timeoutMs: number;
  request?: typeof fetch;
}): Promise<PerformanceResult> {
  const started = Date.now();
  if (!input.enabled) return { provider: "google_pagespeed", available: false, score: null, executionMs: 0, errorClassification: "disabled" };
  if (!input.apiKey) return { provider: "google_pagespeed", available: false, score: null, executionMs: 0, errorClassification: "missing_configuration" };
  try {
    const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    endpoint.searchParams.set("url", input.url); endpoint.searchParams.set("strategy", "mobile"); endpoint.searchParams.set("category", "performance"); endpoint.searchParams.set("key", input.apiKey);
    const response = await (input.request ?? fetch)(endpoint, { signal: AbortSignal.timeout(input.timeoutMs), headers: { accept: "application/json" } });
    const body = await response.text();
    if (Buffer.byteLength(body) > 250_000) throw new Error("provider_response_too_large");
    if (!response.ok) throw new Error(response.status === 429 ? "provider_rate_limited" : "provider_request_failed");
    const parsed = JSON.parse(body) as { lighthouseResult?: { categories?: { performance?: { score?: unknown } } } };
    const raw = parsed.lighthouseResult?.categories?.performance?.score;
    if (typeof raw !== "number" || raw < 0 || raw > 1) throw new Error("provider_invalid_response");
    return { provider: "google_pagespeed", available: true, score: Math.round(raw * 100), executionMs: Date.now() - started, errorClassification: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "provider_request_failed";
    const safe = ["provider_rate_limited", "provider_request_failed", "provider_response_too_large", "provider_invalid_response"].includes(message) ? message : "provider_unavailable";
    return { provider: "google_pagespeed", available: false, score: null, executionMs: Date.now() - started, errorClassification: safe };
  }
}
