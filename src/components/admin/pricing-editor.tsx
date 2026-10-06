"use client";
import { useActionState } from "react";
import { savePricingAction } from "@/app/admin-portal/pricing/actions";
import { billingLabels, moneyInput, pricingCategories } from "@/lib/pricing";
import type { pricingEntries } from "@/lib/db/schema";
type Entry = typeof pricingEntries.$inferSelect;
export function PricingEditor({ entry }: { entry?: Entry }) {
  const [state, action, pending] = useActionState(savePricingAction, {
    message: "",
    success: false,
  });
  return (
    <form action={action} className="admin-form pricing-form">
      <input type="hidden" name="id" value={entry?.id ?? ""} />
      <label>
        Name
        <input
          name="name"
          required
          maxLength={160}
          defaultValue={entry?.name}
        />
      </label>
      <label>
        Category
        <select name="category" defaultValue={entry?.category ?? "website"}>
          {Object.entries(pricingCategories).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="span-two">
        Description
        <textarea
          name="description"
          maxLength={3000}
          rows={2}
          defaultValue={entry?.description}
        />
      </label>
      <label className="span-two">
        Deliverables <span className="field-help">One per line; up to 30.</span>
        <textarea
          name="deliverables"
          rows={4}
          maxLength={6000}
          defaultValue={entry?.deliverables.join("\n")}
        />
      </label>
      <label>
        Billing basis
        <select
          name="billingBasis"
          defaultValue={entry?.billingBasis ?? "one_time"}
        >
          {Object.entries(billingLabels).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Status
        <select name="status" defaultValue={entry?.status ?? "draft"}>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </label>
      <label>
        Base amount (USD)
        <input
          name="amount"
          type="number"
          min="0"
          max="9999999.99"
          step="0.01"
          placeholder="Unset"
          defaultValue={moneyInput(entry?.amountCents ?? null)}
        />
      </label>
      <label>
        Setup fee (USD)
        <input
          name="setupFee"
          type="number"
          min="0"
          max="9999999.99"
          step="0.01"
          placeholder="Unset"
          defaultValue={moneyInput(entry?.setupFeeCents ?? null)}
        />
      </label>
      <label>
        Recurring fee (USD)
        <input
          name="recurringFee"
          type="number"
          min="0"
          max="9999999.99"
          step="0.01"
          placeholder="Unset"
          defaultValue={moneyInput(entry?.recurringFeeCents ?? null)}
        />
      </label>
      <label>
        Recurring interval
        <input
          name="recurringInterval"
          maxLength={80}
          placeholder="For example, monthly"
          defaultValue={entry?.recurringInterval ?? ""}
        />
      </label>
      <p className="span-two field-help">
        Leave unconfirmed amounts blank. The base amount follows the billing
        basis; setup and recurring fees are additional only when your
        description says so. Keep Google advertising spend separate.
      </p>
      <label className="span-two">
        Internal notes
        <textarea
          name="internalNotes"
          maxLength={6000}
          rows={3}
          defaultValue={entry?.internalNotes}
        />
      </label>
      {state.message && (
        <p
          role={state.success ? "status" : "alert"}
          className={`notice span-two ${state.success ? "" : "error-text"}`}
        >
          {state.message}
        </p>
      )}
      <button
        className="button button-primary"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving…" : "Save pricing entry"}
      </button>
    </form>
  );
}
