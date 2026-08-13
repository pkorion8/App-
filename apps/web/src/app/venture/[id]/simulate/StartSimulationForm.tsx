"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, FieldError, Input, Label } from "@venture-sandbox/ui";
import { startSimulation, type StartSimulationState } from "./actions";

const initialState: StartSimulationState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Starting..." : "Start simulation"}</Button>;
}

export function StartSimulationForm({ ventureId }: { ventureId: string }) {
  const boundAction = startSimulation.bind(null, ventureId);
  const [state, formAction] = useFormState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="budgetTotal">Starting budget ($)</Label>
        <Input id="budgetTotal" name="budgetTotal" type="number" min={50} step={10} defaultValue={500} required />
        {state.status === "error" && <FieldError>{state.message}</FieldError>}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-vs-fg">Timeline rules</legend>
        <label className="flex cursor-pointer gap-3 rounded-vs-md border border-vs-border p-3 text-sm">
          <input type="radio" name="simulationMode" value="standard" defaultChecked className="mt-1" />
          <span><strong className="block text-vs-fg">Standard</strong><span className="text-vs-fg-muted">Up to 3 Timeline Rewinds. Each rewind creates a new branch and preserves the original history.</span></span>
        </label>
        <label className="flex cursor-pointer gap-3 rounded-vs-md border border-vs-border p-3 text-sm">
          <input type="radio" name="simulationMode" value="reality" className="mt-1" />
          <span><strong className="block text-vs-fg">Reality Mode</strong><span className="text-vs-fg-muted">0 rewinds. Decisions are permanent for this run, closer to a real operating journey.</span></span>
        </label>
      </fieldset>
      <SubmitButton />
    </form>
  );
}
