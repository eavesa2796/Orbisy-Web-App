import "server-only";
import http from "node:http";
import https from "node:https";
import type { LookupFunction } from "node:net";
import { parsePublicHttpUrl, resolvePublicAddresses, type ResolvedAddress } from "./network";

export type SafeFetchOptions = {
  maxRedirects: number; maxBytes: number; dnsTimeoutMs: number; connectionTimeoutMs: number; overallTimeoutMs: number;
  userAgent: string; resolver?: (host: string) => Promise<ResolvedAddress[]>;
  request?: SafeRequest;
};
export type SafeFetchResult = { finalUrl: string; status: number; redirectCount: number; contentType: string; body: string };
export type SafeResponse = { status: number; headers: http.IncomingHttpHeaders; body: string };
export type SafeRequest = (url: URL, addresses: ResolvedAddress[], options: SafeFetchOptions) => Promise<SafeResponse>;

export function requestOnce(url: URL, addresses: ResolvedAddress[], options: SafeFetchOptions): Promise<SafeResponse> {
  return new Promise((resolve, reject) => {
    const pinned = addresses[0];
    const lookup: LookupFunction = (_hostname, _opts, callback) => callback(null, pinned.address, pinned.family);
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.request(url, {
      method: "GET", lookup, servername: url.hostname,
      headers: { "user-agent": options.userAgent, accept: "text/html,application/xhtml+xml,text/plain;q=0.5", connection: "close" },
      timeout: options.connectionTimeoutMs,
    }, (response) => {
      const chunks: Buffer[] = []; let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > options.maxBytes) { request.destroy(new Error("response_too_large")); return; }
        chunks.push(chunk);
      });
      response.on("end", () => resolve({ status: response.statusCode ?? 0, headers: response.headers, body: Buffer.concat(chunks).toString("utf8") }));
    });
    const overall = setTimeout(() => request.destroy(new Error("overall_timeout")), options.overallTimeoutMs);
    request.on("timeout", () => request.destroy(new Error("connection_timeout")));
    request.on("close", () => clearTimeout(overall));
    request.on("error", reject); request.end();
  });
}

export async function safeFetch(input: string, options: SafeFetchOptions): Promise<SafeFetchResult> {
  let url = parsePublicHttpUrl(input); let redirects = 0;
  while (true) {
    const addresses = await Promise.race([
      resolvePublicAddresses(url.hostname.replace(/^\[|\]$/g, ""), options.resolver),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("dns_timeout")), options.dnsTimeoutMs)),
    ]);
    const response = await (options.request ?? requestOnce)(url, addresses, options);
    if ([301, 302, 303, 307, 308].includes(response.status) && response.headers.location) {
      if (redirects >= options.maxRedirects) throw new Error("too_many_redirects");
      url = parsePublicHttpUrl(new URL(response.headers.location, url).toString()); redirects += 1; continue;
    }
    const contentType = String(response.headers["content-type"] || "").toLowerCase();
    if (!/^(text\/html|application\/xhtml\+xml|text\/plain)(;|$)/.test(contentType)) throw new Error("unsupported_content_type");
    return { finalUrl: url.toString(), status: response.status, redirectCount: redirects, contentType, body: response.body };
  }
}
