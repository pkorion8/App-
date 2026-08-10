"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, FieldError, Input, Label, Select } from "@venture-sandbox/ui";
import { addOutcome, type AddOutcomeState } from "./actions";

const initialState: AddOutcomeState = { status: "idle" };

// Kept as a plain local tuple (not imported from @venture-sandbox/schemas)
// so this client component doesn't pull zod and the whole schemas barrel
// into the browser bundle -- addOutcomeSchema in actions.ts (server-only)
// is still the single source of truth for validation.
const METRIC_TYPES = ["users", "revenue", "cost", "retention", "other"] as const;

const METRIC_LABEL: Record<(typeof METRIC_TYPES)[number], string> = {
  users: "Total users",
  revenue: "Revenue ($/mo)",
  cost: "Cost ($/mo)",
  retention: "Retention (%)",
  other: "Other",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Add real number"}
    </Button>
  );
}

export function AddOutcomeForm({ ventureId }: { ventureId: string }) {
  const boundAction = addOutcome.bind(null, ventureId);
  const [state, formAction] = useFormState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="metricType">Metric</Label>
          <Select id="metricType" name="metricType" defaultValue="users">
            {METRIC_TYPES.map((m) => (
              <option key={m} value={m}>
                {METRIC_LABEL[m]}
              </option>
            ))}
          </Select>
          <FieldError>{state.fieldErrors?.metricType}</FieldError>
        </div>
        <div>
          <Label htmlFor="metricValue">Value</Label>
          <Input id="metricValue" name="metricValue" type="number" step="any" min="0" required />
          <FieldError>{state.fieldErrors?.metricValue}</FieldError>
        </div>
      </div>
      <div>
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" name="note" placeholder="e.g. after the pricing page redesign" />
        <FieldError>{state.fieldErrors?.note}</FieldError>
      </div>
      {state.status === "error" && state.message && <FieldError>{state.message}</FieldError>}
      <SubmitButton />
    </form>
  );
}
