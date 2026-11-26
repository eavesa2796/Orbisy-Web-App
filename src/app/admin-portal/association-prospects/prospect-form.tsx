"use client";

import { useActionState, type ReactNode } from "react";
import { saveAssociationContactDetailsAction, saveAssociationPipelineAction } from "./actions";

export function AssociationProspectForm({ children, disabled, kind }: { children: ReactNode; disabled: boolean; kind: "contacts" | "sales" }) {
  const action = kind === "contacts" ? saveAssociationContactDetailsAction : saveAssociationPipelineAction;
  const [state, submit, pending] = useActionState(action, { success: false, message: "" });
  return (
    <form action={submit} className="admin-form association-prospect-form">
      {children}
      <button className="button button-secondary" disabled={disabled || pending}>
        {pending ? "Saving…" : kind === "contacts" ? "Save contact details" : "Save sales plan"}
      </button>
      {state.message && <p className="field-help span-two" role={state.success ? "status" : "alert"}>{state.message}</p>}
    </form>
  );
}
