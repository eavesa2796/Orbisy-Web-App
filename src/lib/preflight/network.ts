import "server-only";
import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";
import ipaddr from "ipaddr.js";

const metadataHosts = new Set([
  "metadata.google.internal", "metadata.google", "instance-data",
  "169.254.169.254.nip.io",
]);

export type ResolvedAddress = { address: string; family: 4 | 6 };

export function parsePublicHttpUrl(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("invalid_url"); }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("unsupported_scheme");
  if (url.username || url.password) throw new Error("embedded_credentials");
  if (!url.hostname || url.hostname.endsWith(".") || /\s|%|\\/.test(url.hostname)) throw new Error("invalid_hostname");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (metadataHosts.has(host) || host.endsWith(".internal") || host.endsWith(".localhost") || host === "localhost") {
    throw new Error("prohibited_hostname");
  }
  if (/^0x|^0[0-9]|^[0-9]+$/.test(host) && !isIP(host)) throw new Error("ambiguous_ip");
  return url;
}

export function classifyAddress(value: string): "public" | "prohibited" | "invalid" {
  try {
    let address = ipaddr.parse(value);
    if (address.kind() === "ipv6") {
      const ipv6 = address as ipaddr.IPv6;
      if (ipv6.isIPv4MappedAddress()) address = ipv6.toIPv4Address();
    }
    const range = address.range();
    if (address.kind() === "ipv4") {
      if (address.match(ipaddr.parseCIDR("100.64.0.0/10")) || address.match(ipaddr.parseCIDR("192.0.0.0/24")) ||
          address.match(ipaddr.parseCIDR("198.18.0.0/15")) || address.match(ipaddr.parseCIDR("192.0.2.0/24")) ||
          address.match(ipaddr.parseCIDR("198.51.100.0/24")) || address.match(ipaddr.parseCIDR("203.0.113.0/24")) ||
          value === "169.254.169.254") return "prohibited";
    }
    return range === "unicast" ? "public" : "prohibited";
  } catch { return "invalid"; }
}

export async function resolvePublicAddresses(
  hostname: string,
  resolver: (host: string) => Promise<ResolvedAddress[]> = async (host) =>
    (await dnsLookup(host, { all: true, verbatim: true })).map((item) => ({ address: item.address, family: item.family as 4 | 6 })),
) {
  const literal = isIP(hostname);
  const addresses = literal ? [{ address: hostname, family: literal as 4 | 6 }] : await resolver(hostname);
  if (!addresses.length) throw new Error("dns_no_addresses");
  if (addresses.some((item) => classifyAddress(item.address) !== "public")) throw new Error("prohibited_address");
  return addresses;
}
