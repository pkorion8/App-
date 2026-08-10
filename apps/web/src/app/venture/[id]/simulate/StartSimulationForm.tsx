"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, FieldError, Input, Label } from "@venture-sandbox/ui";
import { startSimulation, type StartSimulationState } from "./actions";

const initialState: StartSimulationState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Starting..." : "Start simulation"}
    </Button>
  );
}

export function StartSimulationForm({ ventureId }: { ventureId: string }) {
  const boundAction = startSimulation.bind(null, ventureId);
  const [state, formAction] = useFormState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="budgetTotal">Starting budget ($)</Label>
        <Input
          id="budgetTotal"
          name="budgetTotal"
          type="number"
          min={50}
          step={10}
          defaultValue={500}
          required
        />
        {state.status === "error" && <FieldError>{state.message}</FieldError>}
      </div>
      <SubmitButton />
    </form>
  );
}
