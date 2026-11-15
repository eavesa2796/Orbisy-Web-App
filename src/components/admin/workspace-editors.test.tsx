import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/app/admin-portal/clients/actions", () => ({
  saveWorkspaceAction: vi.fn(),
  saveDiscoveryAction: vi.fn(),
  saveMilestoneAction: vi.fn(),
  addWorkspaceNoteAction: vi.fn(),
  linkLeadAction: vi.fn(),
}));
import {
  WorkspaceEditor,
  DiscoveryEditor,
  LinkLeadEditor,
} from "@/components/admin/workspace-editors";
afterEach(cleanup);
describe("Client form navigation", () => {
  it("clears unsaved fields when a different client record is opened", () => {
    const { rerender } = render(
      WorkspaceEditor({ initial: { name: "First organization" } }),
    );
    fireEvent.change(screen.getByLabelText("Client / organization name"), {
      target: { value: "Unsaved old input" },
    });
    // Server components deliver this same client form boundary with a new record.
    rerender(
      WorkspaceEditor({
        initial: { name: "Second organization" },
        sourceLeadId: "00000000-0000-4000-8000-000000000009",
      }),
    );
    expect(screen.getByLabelText("Client / organization name")).toHaveValue(
      "Second organization",
    );
  });
  it("uses discovery defaults rather than retaining a workspace dropdown choice", () => {
    const { rerender } = render(
      WorkspaceEditor({ initial: { status: "active" } }),
    );
    expect(screen.getByLabelText("Workspace status")).toHaveValue("active");
    rerender(
      DiscoveryEditor({ workspaceId: "00000000-0000-4000-8000-000000000001" }),
    );
    expect(screen.getByLabelText("Brief status")).toHaveValue("draft");
  });
  it("clears a lead choice when a different search result set is displayed", () => {
    const workspaceId = "00000000-0000-4000-8000-000000000001";
    const firstId = "00000000-0000-4000-8000-000000000010";
    const secondId = "00000000-0000-4000-8000-000000000011";
    const { rerender } = render(
      LinkLeadEditor({
        workspaceId,
        leads: [{ id: firstId, name: "First lead", email: null }],
      }),
    );
    fireEvent.change(screen.getByLabelText("Existing lead or inquiry"), {
      target: { value: firstId },
    });
    rerender(
      LinkLeadEditor({
        workspaceId,
        leads: [{ id: secondId, name: "Second lead", email: null }],
      }),
    );
    expect(screen.getByLabelText("Existing lead or inquiry")).toHaveValue("");
  });
});
