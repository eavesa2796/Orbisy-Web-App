"use client";

import { useActionState } from "react";
import { queueSelectedAssociationScansAction } from "./actions";

export function AssociationBulkScanForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(queueSelectedAssociationScansAction, { success: false, message: "" });
  return <form id="association-bulk-scans" action={action}>
    <button className="button button-secondary" disabled={disabled || pending}>{pending ? "Queueing…" : "Queue selected website rechecks"}</button>
    <p className="field-help">Select up to 25 prospects. Queued work carries over to the next daily limit reset.</p>
    {state.message && <p role={state.success ? "status" : "alert"}>{state.message}</p>}
  </form>;
}
