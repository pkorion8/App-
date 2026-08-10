"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, FieldError, Input, Label, Select } from "@venture-sandbox/ui";
import { COUNTRY_OPTIONS } from "@venture-sandbox/research/geography";
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
        <Select id="geography" name="geography" required defaultValue="">
          <option value="" disabled>
            Choose a market
          </option>
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c.code} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>
        <p className="mt-1 text-xs text-vs-fg-muted">
          Picking from this list is what lets us pull real World Bank market data — a typed-in
          place name can&apos;t be matched reliably.
        </p>
        <FieldError>{state.fieldErrors?.geography}</FieldError>
      </div>
      {state.status === "error" && state.message && (
        <FieldError>{state.message}</FieldError>
      )}
      <SubmitButton />
    </form>
  );
}
