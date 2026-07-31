// @vitest-environment node
import { describe, expect, it } from "vitest";
import { validWorkerSecret } from "./worker-auth";
describe("worker authentication",()=>{it("rejects missing, short, and invalid secrets",()=>{expect(validWorkerSecret(null,"a".repeat(24))).toBe(false);expect(validWorkerSecret("wrong","a".repeat(24))).toBe(false);expect(validWorkerSecret("a".repeat(24),"short")).toBe(false)});it("accepts exact strong secret",()=>expect(validWorkerSecret("a".repeat(24),"a".repeat(24))).toBe(true));});
