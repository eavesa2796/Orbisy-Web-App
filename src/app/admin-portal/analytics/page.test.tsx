import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ admin: vi.fn(), summary: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: mocks.admin }));
vi.mock("@/lib/data/admin", () => ({ getAnalyticsSummary: mocks.summary }));
vi.mock("@/components/admin/admin-shell", () => ({
  AdminShell: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));
import Page from "./page";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe("Analytics submission totals", () => {
  it("shows the actual form-success events rather than the old mismatched names", async () => {
    mocks.admin.mockResolvedValue({ email: "admin@example.test" });
    mocks.summary.mockResolvedValue({
      pageViews: 20,
      sessions: 10,
      eventMap: {
        homepage_review_form_submit_success: 7,
        project_request_form_submit_success: 4,
        project_request_submit_success: 99,
      },
      daily: [],
      pages: [],
      referrers: [],
      devices: [],
    });
    render(await Page({ searchParams: Promise.resolve({ days: "7" }) }));
    expect(
      screen.getByText("Tracked review submissions").closest("article"),
    ).toHaveTextContent("7");
    expect(
      screen.getByText("Tracked project requests").closest("article"),
    ).toHaveTextContent("4");
    expect(mocks.summary).toHaveBeenCalledWith(7);
  });
  it("requires administrator access before loading metrics", async () => {
    mocks.admin.mockRejectedValue(new Error("AUTH_REQUIRED"));
    await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      "AUTH_REQUIRED",
    );
    expect(mocks.summary).not.toHaveBeenCalled();
  });
});
