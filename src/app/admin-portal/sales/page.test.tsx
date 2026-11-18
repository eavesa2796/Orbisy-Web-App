import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ admin: vi.fn(), summary: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: mocks.admin }));
vi.mock("@/lib/data/sales", () => ({ getSalesSummary: mocks.summary }));
vi.mock("@/components/admin/admin-shell", () => ({ AdminShell: ({ children }: {
        children: React.ReactNode;
    }) => <main>{children}</main> }));
import Page from "./page";
import { salesRange } from "@/lib/sales-reporting";
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe("Sales overview access and error state", () => {
    it("does not replace unavailable records with zero or read the database without admin access", async () => { mocks.admin.mockRejectedValueOnce(Error("AUTH_REQUIRED")); await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow("AUTH_REQUIRED"); expect(mocks.summary).not.toHaveBeenCalled(); mocks.admin.mockResolvedValue({ email: "admin@example.test" }); mocks.summary.mockRejectedValueOnce(Error("Unavailable")); render(await Page({ searchParams: Promise.resolve({}) })); expect(screen.getByRole("heading", { name: "Sales records are temporarily unavailable" })).toBeInTheDocument(); expect(screen.queryByRole("region", { name: "Saved inquiry summary" })).not.toBeInTheDocument(); });
    it("accepts only supported rolling windows or explicit all time", () => { expect(salesRange("0")).toBe(0); expect(salesRange("7")).toBe(7); for (const value of [undefined, "", "abc", "-1", "Infinity", ["7"], "365"])
        expect(salesRange(value)).toBe(30); });
});
