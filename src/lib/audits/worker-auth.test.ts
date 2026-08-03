// @vitest-environment node
import { describe, expect, it } from "vitest";
import { validDeepAuditWorkerSecret } from "./worker-auth";

describe("deep-audit worker authentication", () => {
  const secret = "a-strong-separate-deep-audit-secret";
  it("accepts only the dedicated configured secret", () => {
    expect(validDeepAuditWorkerSecret(secret, secret)).toBe(true);
    expect(validDeepAuditWorkerSecret("wrong", secret)).toBe(false);
  });
  it("rejects missing and short configuration", () => {
    expect(validDeepAuditWorkerSecret(null, secret)).toBe(false);
    expect(validDeepAuditWorkerSecret("short", "short")).toBe(false);
  });
});
