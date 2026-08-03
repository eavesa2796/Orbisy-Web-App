// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { inspectMobilePerformance } from "./pagespeed";

describe("optional PageSpeed adapter", () => {
  it("reports disabled and missing configuration honestly", async () => {
    expect((await inspectMobilePerformance({ url: "https://example.com", enabled: false, timeoutMs: 1000 })).errorClassification).toBe("disabled");
    expect((await inspectMobilePerformance({ url: "https://example.com", enabled: true, timeoutMs: 1000 })).errorClassification).toBe("missing_configuration");
  });
  it("records a provider score without inventing one", async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ lighthouseResult: { categories: { performance: { score: 0.62 } } } }), { status: 200 }));
    const result = await inspectMobilePerformance({ url: "https://example.com", enabled: true, apiKey: "test-key", timeoutMs: 1000, request });
    expect(result).toMatchObject({ available: true, score: 62, errorClassification: null });
  });
});
