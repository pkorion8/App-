"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, FieldError, Input, Label, Select } from "@venture-sandbox/ui";
import { addOutcome, type AddOutcomeState } from "./actions";

const initialState: AddOutcomeState = { status: "idle" };
const METRIC_TYPES = ["users", "revenue", "cost", "retention", "conversion", "activation", "churn", "qualitative", "milestone", "other"] as const;
const METRIC_LABEL: Record<(typeof METRIC_TYPES)[number], string> = {
  users: "Total users",
  revenue: "Revenue ($/mo)",
  cost: "Cost ($/mo)",
  retention: "Retention (%)",
  conversion: "Conversion (%)",
  activation: "Activation (%)",
  churn: "Churn (%)",
  qualitative: "Qualitative signal (0–100)",
  milestone: "Milestone completion (%)",
  other: "Other",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Add reported observation"}</Button>;
}

export function AddOutcomeForm({ ventureId }: { ventureId: string }) {
  const boundAction = addOutcome.bind(null, ventureId);
  const [state, formAction] = useFormState(boundAction, initialState);
  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><Label htmlFor="metricType">Metric</Label><Select id="metricType" name="metricType" defaultValue="users">{METRIC_TYPES.map((m) => <option key={m} value={m}>{METRIC_LABEL[m]}</option>)}</Select><FieldError>{state.fieldErrors?.metricType}</FieldError></div>
        <div><Label htmlFor="metricValue">Value</Label><Input id="metricValue" name="metricValue" type="number" step="any" min="0" required /><p className="mt-1 text-xs text-vs-fg-muted">Percentage-style metrics must be between 0 and 100.</p><FieldError>{state.fieldErrors?.metricValue}</FieldError></div>
      </div>
      <div><Label htmlFor="note">Observation / context (optional)</Label><Input id="note" name="note" placeholder="e.g. after launch, onboarding change, interview batch, milestone reached" /><FieldError>{state.fieldErrors?.note}</FieldError></div>
      <p className="text-xs leading-5 text-vs-fg-muted">These values are manually reported by you. Sim Venture stores them as observations; it does not independently verify them.</p>
      {state.status === "error" && state.message && <FieldError>{state.message}</FieldError>}
      <SubmitButton />
    </form>
  );
}
