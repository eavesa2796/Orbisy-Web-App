// @vitest-environment node
import { expect, it, vi } from "vitest";
const database = vi.hoisted(() => vi.fn(() => { throw Error("Must not touch historical events"); }));
vi.mock("@/lib/db", () => ({ getDb: database }));
import { POST } from "./route";
it("retires the collector without touching requests, stored events, rate limits, or retention", async () => { vi.stubEnv("ANALYTICS_ENABLED", "true"); const response = await POST(); expect(response.status).toBe(204); expect(response.headers.get("Cache-Control")).toBe("no-store"); expect(database).not.toHaveBeenCalled(); vi.unstubAllEnvs(); });
