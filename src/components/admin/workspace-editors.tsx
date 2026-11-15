import {
  WorkspaceForm,
  type WorkspaceField,
} from "@/components/admin/workspace-form";
import {
  briefFields,
  workspaceStatuses,
  proposalStatuses,
  briefStatuses,
  milestoneStatuses,
} from "@/lib/client-workspaces";
import type {
  clientWorkspaces,
  clientMilestones,
  discoveryBriefs,
} from "@/lib/db/schema";
const options = (labels: Record<string, string>) => Object.entries(labels);
const workspaceFields: WorkspaceField[] = [
  {
    name: "name",
    label: "Client / organization name",
    required: true,
    max: 160,
  },
  {
    name: "status",
    label: "Workspace status",
    type: "select",
    required: true,
    options: options(workspaceStatuses),
  },
  { name: "contactName", label: "Primary contact", max: 120 },
  { name: "contactEmail", label: "Contact email", type: "email", max: 254 },
  { name: "contactRole", label: "Contact role", max: 120 },
  { name: "websiteUrl", label: "Website", type: "url", max: 500 },
  { name: "cms", label: "CMS / website platform", max: 200 },
  {
    name: "proposalStatus",
    label: "Proposal status",
    type: "select",
    required: true,
    options: options(proposalStatuses),
  },
  {
    name: "proposalUrl",
    label: "Proposal document link",
    type: "url",
    max: 500,
    wide: true,
    help: "Reference an existing proposal. Status is recorded manually; it does not send or accept a proposal.",
  },
  {
    name: "platforms",
    label: "Membership, event, and other systems",
    type: "textarea",
    wide: true,
    help: "Platform names, account editions, and relevant documentation. Familiarity does not establish integration feasibility.",
  },
  {
    name: "vendorContacts",
    label: "Vendor contacts and account ownership",
    type: "textarea",
    wide: true,
    help: "Who can approve access, answer platform questions, and manage the account?",
  },
  {
    name: "accessNotes",
    label: "Access references",
    type: "textarea",
    max: 2000,
    wide: true,
    help: "Password-manager item names or non-secret access instructions only. Do not store passwords, API keys, tokens, or recovery codes here.",
  },
  {
    name: "currentScope",
    label: "Current project scope",
    type: "textarea",
    wide: true,
    max: 5000,
  },
  { name: "nextAction", label: "Next action", max: 300 },
  {
    name: "nextActionDate",
    label: "Next action date",
    type: "date",
    help: "Calendar date in Chicago time. Add an action description when scheduling it.",
  },
  {
    name: "supportScope",
    label: "Routine care / ongoing support scope",
    type: "textarea",
    wide: true,
  },
  {
    name: "supportCapacity",
    label: "Agreed development capacity",
    max: 200,
    help: "For example, the capacity in the signed agreement. Leave unset until agreed.",
  },
  {
    name: "supportBoundaries",
    label: "Support boundaries and larger work",
    type: "textarea",
    wide: true,
    help: "Record exclusions, scheduling, escalation, renewal, and what needs a separate scope.",
  },
];
export function WorkspaceEditor({
  entry,
  sourceLeadId,
  initial,
}: {
  entry?: typeof clientWorkspaces.$inferSelect;
  sourceLeadId?: string;
  initial?: Record<string, string>;
}) {
  const values: Record<string, string> = {
    status: "prospect",
    proposalStatus: "not_started",
    ...initial,
  };
  if (entry)
    for (const field of workspaceFields)
      values[field.name] = String(
        entry[field.name as keyof typeof entry] ?? "",
      );
  return (
    <WorkspaceForm
      kind="workspace"
      fields={workspaceFields}
      values={values}
      hidden={{
        id: entry?.id ?? crypto.randomUUID(),
        version: String(entry?.version ?? 1),
        mode: entry ? "update" : "create",
        sourceLeadId: sourceLeadId ?? "",
      }}
      submitLabel={entry ? "Save workspace" : "Create client workspace"}
    />
  );
}
export function DiscoveryEditor({
  workspaceId,
  entry,
}: {
  workspaceId: string;
  entry?: typeof discoveryBriefs.$inferSelect;
}) {
  const fields: WorkspaceField[] = [
    { name: "title", label: "Brief title", required: true, max: 160 },
    {
      name: "status",
      label: "Brief status",
      type: "select",
      required: true,
      options: options(briefStatuses),
    },
    ...briefFields.map(([name, label, help]) => ({
      name,
      label,
      help,
      type: "textarea" as const,
      wide: true,
      max: 3000,
    })),
  ];
  return (
    <WorkspaceForm
      kind="discovery"
      fields={fields}
      values={{
        title: entry?.title ?? "Website and workflow discovery",
        status: entry?.status ?? "draft",
        ...entry?.answers,
      }}
      hidden={{
        id: entry?.id ?? crypto.randomUUID(),
        workspaceId,
        version: String(entry?.version ?? 1),
        mode: entry ? "update" : "create",
      }}
      submitLabel="Save discovery brief"
    />
  );
}
export function MilestoneEditor({
  workspaceId,
  entry,
}: {
  workspaceId: string;
  entry?: typeof clientMilestones.$inferSelect;
}) {
  return (
    <WorkspaceForm
      kind="milestone"
      fields={[
        { name: "title", label: "Milestone", required: true, max: 200 },
        { name: "project", label: "Project / engagement", max: 160 },
        {
          name: "status",
          label: "Milestone status",
          required: true,
          type: "select",
          options: options(milestoneStatuses),
        },
        { name: "dueDate", label: "Due date", type: "date" },
        {
          name: "nextStep",
          label: "Next step / blocker",
          max: 500,
          wide: true,
        },
      ]}
      values={{
        title: entry?.title ?? "",
        project: entry?.project ?? "",
        status: entry?.status ?? "open",
        dueDate: entry?.dueDate ?? "",
        nextStep: entry?.nextStep ?? "",
      }}
      hidden={{
        id: entry?.id ?? crypto.randomUUID(),
        workspaceId,
        version: String(entry?.version ?? 1),
        mode: entry ? "update" : "create",
      }}
      successHref={`/admin-portal/clients/${workspaceId}#milestones`}
      submitLabel={entry ? "Save milestone" : "Add milestone"}
    />
  );
}
export function WorkspaceNoteEditor({ workspaceId }: { workspaceId: string }) {
  return (
    <WorkspaceForm
      kind="note"
      fields={[
        {
          name: "body",
          label: "Private note",
          type: "textarea",
          wide: true,
          max: 5000,
          required: true,
          help: "Record decisions, meeting notes, or context. Keep credentials and confidential member records in the appropriate secure system.",
        },
      ]}
      hidden={{ id: crypto.randomUUID(), workspaceId }}
      values={{}}
      successHref={`/admin-portal/clients/${workspaceId}#notes`}
      submitLabel="Add private note"
    />
  );
}
export function LinkLeadEditor({
  workspaceId,
  leads,
}: {
  workspaceId: string;
  leads: Array<{ id: string; name: string; email: string | null }>;
}) {
  return (
    <WorkspaceForm
      kind="link"
      fields={[
        {
          name: "leadId",
          label: "Existing lead or inquiry",
          type: "select",
          required: true,
          wide: true,
          options: [
            ["", "Choose a record"],
            ...leads.map(
              (lead) =>
                [
                  lead.id,
                  `${lead.name}${lead.email ? ` · ${lead.email}` : ""}`,
                ] as [string, string],
            ),
          ],
        },
      ]}
      hidden={{ workspaceId }}
      values={{}}
      submitLabel="Link existing record"
    />
  );
}
