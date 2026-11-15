"use client";
import { useActionState } from "react";
import Link from "next/link";
import {
  saveWorkspaceAction,
  saveDiscoveryAction,
  saveMilestoneAction,
  addWorkspaceNoteAction,
  linkLeadAction,
  unlinkLeadAction,
  type WorkspaceActionState,
} from "@/app/admin-portal/clients/actions";
export type WorkspaceField = {
  name: string;
  label: string;
  help?: string;
  type?: "text" | "email" | "url" | "date" | "textarea" | "select";
  required?: boolean;
  max?: number;
  wide?: boolean;
  options?: Array<[string, string]>;
};
const actions = {
  workspace: saveWorkspaceAction,
  discovery: saveDiscoveryAction,
  milestone: saveMilestoneAction,
  note: addWorkspaceNoteAction,
  link: linkLeadAction,
  unlink: unlinkLeadAction,
};
export function WorkspaceForm({
  kind,
  fields,
  values,
  hidden,
  submitLabel,
  successHref,
}: {
  kind: keyof typeof actions;
  fields: WorkspaceField[];
  values: Record<string, string>;
  hidden: Record<string, string>;
  submitLabel: string;
  successHref?: string;
}) {
  const [state, action, pending] = useActionState(actions[kind], {
    success: false,
    message: "",
  } as WorkspaceActionState);
  const savedCreation =
    state.success && (hidden.mode === "create" || kind === "note");
  const target =
    state.recordId && kind === "workspace"
      ? `/admin-portal/clients/${state.recordId}`
      : state.recordId && kind === "discovery"
        ? `/admin-portal/clients/${hidden.workspaceId}/discovery/${state.recordId}`
        : successHref;
  if (savedCreation)
    return (
      <div className="workspace-save-result" role="status">
        <strong>{state.message}</strong>
        {target && (
          <Link className="text-link" href={target}>
            Open saved{" "}
            {kind === "workspace"
              ? "workspace"
              : kind === "discovery"
                ? "brief"
                : "record"}{" "}
            →
          </Link>
        )}
        <button
          type="button"
          className="button button-secondary"
          onClick={() => window.location.reload()}
        >
          {" "}
          {kind === "workspace" || kind === "discovery"
            ? "Refresh this page"
            : "Add another"}
        </button>
      </div>
    );
  return (
    <form
      action={action}
      className="admin-form workspace-form"
      aria-busy={pending}
    >
      {Object.entries(hidden).map(([name, value]) => (
        <input
          key={name}
          name={name}
          type="hidden"
          value={
            name === "version" && state.version ? String(state.version) : value
          }
        />
      ))}
      {fields.map((field) => {
        const inputId = `workspace-${hidden.id ?? hidden.workspaceId ?? kind}-${field.name}`;
        const errors = state.fields?.[field.name];
        const helpId = field.help ? `${inputId}-help` : undefined;
        const errorId = errors ? `${inputId}-error` : undefined;
        const shared = {
          id: inputId,
          name: field.name,
          defaultValue: state.values?.[field.name] ?? values[field.name] ?? "",
          required: field.required,
          "aria-invalid": !!errors,
          "aria-describedby":
            [helpId, errorId].filter(Boolean).join(" ") || undefined,
        };
        return (
          <div
            className={`workspace-field${field.wide ? " span-two" : ""}`}
            key={field.name}
          >
            <label htmlFor={inputId}>
              {field.label}
              {!field.required && <span className="field-help"> optional</span>}
            </label>
            {field.help && (
              <p className="field-help" id={helpId}>
                {field.help}
              </p>
            )}
            {field.type === "textarea" ? (
              <textarea {...shared} rows={4} maxLength={field.max ?? 3000} />
            ) : field.type === "select" ? (
              <select {...shared}>
                {field.options?.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                {...shared}
                type={field.type ?? "text"}
                maxLength={field.max ?? 300}
              />
            )}{" "}
            {errors && (
              <p className="workspace-field-error" id={errorId}>
                {errors.join(" ")}
              </p>
            )}
          </div>
        );
      })}
      {state.message && (
        <p
          className={`notice span-two${state.success ? "" : " warning-notice"}`}
          role={state.success ? "status" : "alert"}
        >
          {state.message}
        </p>
      )}
      {state.success && target && (
        <Link className="text-link span-two" href={target}>
          View saved{" "}
          {kind === "workspace"
            ? "workspace"
            : kind === "discovery"
              ? "brief"
              : "record"}{" "}
          →
        </Link>
      )}
      <div className="span-two workspace-form-footer">
        <button className="button" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
        <span className="field-help">
          Private to the administrator. No message is sent.
        </span>
      </div>
    </form>
  );
}
export function PrintBriefButton() {
  return (
    <button
      className="button button-secondary no-print"
      onClick={() => window.print()}
    >
      Print / save as PDF
    </button>
  );
}
