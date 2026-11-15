import { z } from "zod";

export const workspaceStatuses = {
  prospect: "Prospect",
  active: "Active client",
  paused: "Paused",
  archived: "Archived",
} as const;
export const proposalStatuses = {
  not_started: "Not started",
  scoping: "Scoping",
  draft: "Draft",
  sent: "Awaiting response",
  accepted: "Accepted",
  declined: "Declined",
} as const;
export const briefStatuses = {
  draft: "Draft",
  ready: "Ready for review",
  archived: "Archived",
} as const;
export const milestoneStatuses = {
  open: "Open",
  blocked: "Blocked",
  done: "Done",
} as const;
export const briefFields = [
  [
    "goals",
    "Business goals",
    "What should this project make easier? Define the problem and intended outcome.",
  ],
  [
    "audiences",
    "Audiences and journeys",
    "Members, prospective members, staff, committees, sponsors, and event attendees; their main tasks.",
  ],
  [
    "problems",
    "Current problems",
    "Where are people getting stuck? What is manual, duplicated, or difficult to find?",
  ],
  [
    "editing",
    "Content editing and CMS",
    "Who edits and publishes? What content types, approval rules, and training are needed?",
  ],
  [
    "migration",
    "Content and data migration",
    "What needs to move, its source, volume, cleanup, redirects, and ownership?",
  ],
  [
    "permissions",
    "Roles and permissions",
    "Who can see, create, review, approve, or export each kind of information?",
  ],
  [
    "platforms",
    "Existing systems and feasibility",
    "CMS, AMS, event tools, available APIs, account editions, SSO options, and source of truth.",
  ],
  [
    "dependencies",
    "Vendor and access dependencies",
    "Vendor contacts, documentation, required access, fees, test accounts, and unresolved feasibility questions.",
  ],
  [
    "deliverables",
    "Deliverables",
    "Specific pages, templates, features, connections, documentation, and handover outputs.",
  ],
  [
    "exclusions",
    "Exclusions",
    "What is explicitly outside this scope? Record assumptions and change-request boundaries.",
  ],
  [
    "responsibilities",
    "Client responsibilities",
    "Content, access, feedback, decisions, data cleanup, testing, and approvals the client provides.",
  ],
  [
    "acceptance",
    "Acceptance criteria",
    "Observable checks that establish when each deliverable is complete.",
  ],
  [
    "testing",
    "Testing and launch",
    "Access checks, data flows, failure cases, keyboard/mobile review, deployment, and rollback ownership.",
  ],
  [
    "timing",
    "Schedule and constraints",
    "Milestones, content readiness, review windows, budget discussion, and dependencies.",
  ],
  [
    "support",
    "After-launch arrangements",
    "Routine care, separately scoped improvements, integration maintenance, and ownership.",
  ],
  [
    "nextSteps",
    "Open questions and next steps",
    "Decisions needed, who owns them, and what should happen next.",
  ],
] as const;
export type BriefField = (typeof briefFields)[number][0];
const text = (max: number) => z.string().trim().max(max);
const requiredText = (max: number) =>
  text(max).min(1, "This field is required.");
const id = z.uuid("Choose a valid record.");
const optionalId = z.preprocess(
  (value) => (value === "" ? undefined : value),
  id.optional(),
);
const version = z.coerce.number().int().min(1);
const httpUrl = text(500).refine(
  (value) =>
    !value ||
    (() => {
      try {
        const url = new URL(value);
        return (
          ["https:", "http:"].includes(url.protocol) &&
          !url.username &&
          !url.password
        );
      } catch {
        return false;
      }
    })(),
  "Use an http:// or https:// URL without credentials.",
);
export const calendarDate = z
  .string()
  .refine(
    (value) =>
      !value ||
      (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
        Number(value.slice(0, 4)) >= 1900 &&
        Number(value.slice(0, 4)) <= 2200 &&
        !Number.isNaN(Date.parse(value)) &&
        new Date(value).toISOString().slice(0, 10) === value),
    "Enter a valid calendar date.",
  );
export const workspaceSchema = z
  .object({
    id,
    version,
    mode: z.enum(["create", "update"]),
    sourceLeadId: optionalId,
    name: requiredText(160),
    status: z.enum(["prospect", "active", "paused", "archived"]),
    contactName: text(120),
    contactEmail: text(254).refine(
      (value) => !value || z.email().safeParse(value).success,
      "Enter a valid email.",
    ),
    contactRole: text(120),
    websiteUrl: httpUrl,
    cms: text(200),
    platforms: text(3000),
    vendorContacts: text(3000),
    accessNotes: text(2000),
    currentScope: text(5000),
    supportScope: text(3000),
    supportCapacity: text(200),
    supportBoundaries: text(3000),
    nextAction: text(300),
    nextActionDate: calendarDate,
    proposalStatus: z.enum([
      "not_started",
      "scoping",
      "draft",
      "sent",
      "accepted",
      "declined",
    ]),
    proposalUrl: httpUrl,
  })
  .superRefine((value, ctx) => {
    if (value.nextActionDate && !value.nextAction)
      ctx.addIssue({
        code: "custom",
        path: ["nextAction"],
        message: "Describe the next action when setting a date.",
      });
  });
const briefShape = Object.fromEntries(
  briefFields.map(([key]) => [key, text(3000)]),
) as Record<BriefField, ReturnType<typeof text>>;
export const discoverySchema = z
  .object({
    id,
    workspaceId: id,
    version,
    mode: z.enum(["create", "update"]),
    title: requiredText(160),
    status: z.enum(["draft", "ready", "archived"]),
    ...briefShape,
  })
  .superRefine((value, ctx) => {
    if (value.status !== "ready") return;
    for (const key of [
      "goals",
      "deliverables",
      "exclusions",
      "responsibilities",
      "acceptance",
    ] as const)
      if (!value[key]?.trim())
        ctx.addIssue({
          code: "custom",
          path: [key],
          message:
            "Complete this section before marking the brief ready for review.",
        });
  });
export const milestoneSchema = z.object({
  id,
  workspaceId: id,
  version,
  mode: z.enum(["create", "update"]),
  title: requiredText(200),
  project: text(160),
  status: z.enum(["open", "blocked", "done"]),
  dueDate: calendarDate,
  nextStep: text(500),
});
export const noteSchema = z.object({
  id,
  workspaceId: id,
  body: requiredText(5000),
});
export const linkLeadSchema = z.object({ workspaceId: id, leadId: id });
export const recordIdSchema = id;
export function todayInChicago(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function displayDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        dateStyle: "medium",
      }).format(new Date(value + "T12:00:00Z"))
    : "Not scheduled";
}
export function displayTimestamp(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Chicago",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(value)
    : "Not scheduled";
}
export function briefMarkdown(
  workspaceName: string,
  brief: {
    title: string;
    status: string;
    version: number;
    answers: Record<string, string>;
  },
) {
  return (
    `# ${brief.title}\n\nClient: ${workspaceName}\nStatus: ${briefStatuses[brief.status as keyof typeof briefStatuses] ?? brief.status}\nRevision: ${brief.version}\n\nInternal planning brief. Ready for review does not mean client approval or an accepted contract.\n\n` +
    briefFields
      .map(
        ([key, label]) =>
          `## ${label}\n\n${brief.answers[key] || "Not yet recorded."}\n`,
      )
      .join("\n")
  );
}
