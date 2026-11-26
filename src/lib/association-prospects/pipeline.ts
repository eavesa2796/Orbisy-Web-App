import { z } from "zod";
import { associationSalesStage } from "@/lib/db/schema";

export const associationStageLabels: Record<(typeof associationSalesStage.enumValues)[number], string> = {
  needs_review: "Needs review",
  ready_to_contact: "Ready to contact",
  contacted: "Contacted",
  follow_up: "Follow up",
  skip: "Skip",
};

export const associationPipelineInput = z.object({
  stage: z.enum(associationSalesStage.enumValues),
  action: z.string().trim().max(300),
  dueDate: z.union([z.literal(""), z.iso.date()]),
  lastInteraction: z.string().trim().max(600),
}).superRefine(({ stage, action, dueDate }, context) => {
  if (dueDate && !action) context.addIssue({ code: "custom", path: ["action"], message: "Enter a next action for the due date." });
  if (stage === "follow_up" && !dueDate) context.addIssue({ code: "custom", path: ["dueDate"], message: "Set a due date for the follow-up." });
});
