// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { pinnedLookupResult, safeFetch, type SafeRequest } from "./safe-fetch";

const base = {
  maxRedirects: 2,
  maxBytes: 1000,
  dnsTimeoutMs: 25,
  connectionTimeoutMs: 25,
  overallTimeoutMs: 50,
  userAgent: "OrbisyPreflight/Test (+https://orbisy.com/preflight)",
};

describe("safe fetch policy orchestration", () => {
  it("prefers a validated IPv4 address when IPv6 is also available", () => {
    expect(pinnedLookupResult([
      { address: "2606:4700:4700::1111", family: 6 },
      { address: "1.1.1.1", family: 4 },
    ], false)).toEqual({ address: "1.1.1.1", family: 4 });
  });

  it("returns an address array for Node all-address lookup mode", () => {
    expect(pinnedLookupResult([{ address: "1.1.1.1", family: 4 }], true))
      .toEqual([{ address: "1.1.1.1", family: 4 }]);
  });

  it("validates a redirect before connecting to its destination", async () => {
    const request = vi.fn(async () => ({ status: 302, headers: { location: "https://other.example/path" }, body: "" }));
    await expect(safeFetch("https://first.example", {
      ...base, request, resolver: async () => [{ address: "1.1.1.1", family: 4 }],
      validateRedirect: (url) => { if (url.hostname !== "first.example") throw new Error("cross_domain_destination"); },
    })).rejects.toThrow("cross_domain_destination");
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("re-resolves and revalidates every redirect", async () => {
    const resolver = vi.fn(async (host: string) =>
      host === "first.example"
        ? [{ address: "1.1.1.1", family: 4 as const }]
        : [{ address: "8.8.8.8", family: 4 as const }],
    );
    const request: SafeRequest = vi
      .fn()
      .mockResolvedValueOnce({ status: 302, headers: { location: "https://second.example/home" }, body: "" })
      .mockResolvedValueOnce({ status: 200, headers: { "content-type": "text/html; charset=utf-8" }, body: "<html/>" });
    const result = await safeFetch("https://first.example", { ...base, resolver, request });
    expect(result.finalUrl).toBe("https://second.example/home");
    expect(resolver).toHaveBeenNthCalledWith(1, "first.example");
    expect(resolver).toHaveBeenNthCalledWith(2, "second.example");
  });

  it("blocks a redirect whose DNS answer becomes private before requesting it", async () => {
    const request = vi.fn().mockResolvedValue({ status: 302, headers: { location: "https://private.example" }, body: "" });
    const resolver = async (host: string) => [{ address: host === "private.example" ? "127.0.0.1" : "1.1.1.1", family: 4 as const }];
    await expect(safeFetch("https://public.example", { ...base, resolver, request })).rejects.toThrow("prohibited_address");
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("blocks changed or mixed answers on a later resolution", async () => {
    let calls = 0;
    const resolver = async () => (++calls === 1
      ? [{ address: "1.1.1.1", family: 4 as const }]
      : [{ address: "1.1.1.1", family: 4 as const }, { address: "10.0.0.1", family: 4 as const }]);
    const request = vi.fn().mockResolvedValue({ status: 302, headers: { location: "https://same.example/again" }, body: "" });
    await expect(safeFetch("https://same.example", { ...base, resolver, request })).rejects.toThrow("prohibited_address");
  });

  it("enforces the redirect bound", async () => {
    const request = vi.fn().mockResolvedValue({ status: 302, headers: { location: "/again" }, body: "" });
    await expect(safeFetch("https://example.com", { ...base, maxRedirects: 1, resolver: async () => [{ address: "1.1.1.1", family: 4 }], request })).rejects.toThrow("too_many_redirects");
  });

  it.each(["response_too_large", "connection_timeout", "overall_timeout"])("preserves the bounded transport error %s", async (code) => {
    const request: SafeRequest = async () => { throw new Error(code); };
    await expect(safeFetch("https://example.com", { ...base, resolver: async () => [{ address: "1.1.1.1", family: 4 }], request })).rejects.toThrow(code);
  });

  it("bounds DNS resolution time", async () => {
    await expect(safeFetch("https://example.com", { ...base, dnsTimeoutMs: 5, resolver: () => new Promise(() => {}), request: vi.fn() })).rejects.toThrow("dns_timeout");
  });

  it("rejects non-page response content", async () => {
    const request: SafeRequest = async () => ({ status: 200, headers: { "content-type": "application/octet-stream" }, body: "binary" });
    await expect(safeFetch("https://example.com", { ...base, resolver: async () => [{ address: "1.1.1.1", family: 4 }], request })).rejects.toThrow("unsupported_content_type");
  });
});
