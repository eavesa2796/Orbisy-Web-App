"use client";

import { useActionState, type ReactNode } from "react";
import { saveAssociationContactDetailsAction } from "./actions";

export function AssociationContactForm({ children, disabled }: { children: ReactNode; disabled: boolean }) {
  const [state, submit, pending] = useActionState(saveAssociationContactDetailsAction, { success: false, message: "" });
  return (
    <form action={submit} className="admin-form association-prospect-form">
      {children}
      <button className="button button-secondary" disabled={disabled || pending}>
        {pending ? "Saving…" : "Save contact details"}
      </button>
      {state.message && <p className="field-help span-two" role={state.success ? "status" : "alert"}>{state.message}</p>}
    </form>
  );
}
