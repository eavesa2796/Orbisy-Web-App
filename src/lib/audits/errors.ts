export function safeAuditError(error: unknown) {
  const message = error instanceof Error ? error.message : "unknown_error";
  const allowed = new Set([
    "invalid_url", "unsupported_scheme", "embedded_credentials", "invalid_hostname",
    "prohibited_hostname", "ambiguous_ip", "dns_no_addresses", "dns_timeout",
    "prohibited_address", "response_too_large", "overall_timeout", "connection_timeout",
    "too_many_redirects", "unsupported_content_type", "cross_domain_destination",
    "robots_disallowed", "total_audit_bytes_exceeded", "audit_timeout",
    "suppressed", "homepage_unavailable", "website_unavailable", "lead_not_found", "kill_switch",
  ]);
  if (allowed.has(message)) return message;
  const code = (error as { code?: unknown } | null)?.code;
  if (code === "EAI_AGAIN") return "dns_temporary_failure";
  if (code === "ENOTFOUND") return "dns_no_addresses";
  if (code === "ENETUNREACH" || code === "EHOSTUNREACH") return "network_unreachable";
  if (code === "ECONNREFUSED" || code === "ECONNRESET" || code === "EPIPE") return "connection_failed";
  if (code === "ERR_INVALID_IP_ADDRESS") return "invalid_pinned_address";
  if (typeof code === "string" && (code.includes("CERT") || code.includes("TLS"))) return "tls_validation_failed";
  return "network_request_failed";
}

export const RETRYABLE_AUDIT_ERRORS = new Set([
  "dns_timeout", "dns_temporary_failure", "network_unreachable", "connection_failed",
  "overall_timeout", "connection_timeout", "network_request_failed",
]);
