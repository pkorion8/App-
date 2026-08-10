"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, FieldError, Input, Label } from "@venture-sandbox/ui";
import { startResearch, type StartResearchState } from "./actions";

const initialState: StartResearchState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Starting..." : "Start research"}
    </Button>
  );
}

export function ClarificationForm({ ventureId }: { ventureId: string }) {
  const boundAction = startResearch.bind(null, ventureId);
  const [state, formAction] = useFormState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="targetUser">Who is this for?</Label>
        <Input
          id="targetUser"
          name="targetUser"
          placeholder="e.g. small salon owners, teenagers, freelance designers"
          required
        />
        <FieldError>{state.fieldErrors?.targetUser}</FieldError>
      </div>
      <div>
        <Label htmlFor="geography">Where?</Label>
        <Input id="geography" name="geography" placeholder="e.g. Canada, United States" required />
        <FieldError>{state.fieldErrors?.geography}</FieldError>
      </div>
      {state.status === "error" && state.message && (
        <FieldError>{state.message}</FieldError>
      )}
      <SubmitButton />
    </form>
  );
}
