import { describe, expect, it } from "vitest";
import { associationPipelineInput } from "./pipeline";

describe("association sales plan", () => {
  const plan = { stage: "follow_up", action: "Call the office", dueDate: "2026-11-28", lastInteraction: "Asked for a call next week." };

  it("accepts a dated follow-up with a next action", () => {
    expect(associationPipelineInput.parse(plan)).toEqual(plan);
  });

  it("validates the stage and calendar date and requires follow-up details", () => {
    expect(associationPipelineInput.safeParse({ ...plan, stage: "sent_automatically" }).success).toBe(false);
    expect(associationPipelineInput.safeParse({ ...plan, dueDate: "2026-02-30" }).success).toBe(false);
    expect(associationPipelineInput.safeParse({ ...plan, dueDate: "" }).success).toBe(false);
    expect(associationPipelineInput.safeParse({ ...plan, action: " " }).success).toBe(false);
    expect(associationPipelineInput.safeParse({ ...plan, stage: "needs_review", dueDate: "", action: "" }).success).toBe(true);
  });
});
