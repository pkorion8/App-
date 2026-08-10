"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, FieldError, Input, Label, Textarea } from "@venture-sandbox/ui";
import { createVenture, type CreateVentureState } from "./actions";

const initialState: CreateVentureState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating..." : "Create venture"}
    </Button>
  );
}

export function CreateVentureForm() {
  const [state, formAction] = useFormState(createVenture, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">Venture name</Label>
        <Input id="name" name="name" placeholder="Nail design try-on app" required />
        <FieldError>{state.fieldErrors?.name}</FieldError>
      </div>
      <div>
        <Label htmlFor="rawIdeaText">What&apos;s the idea?</Label>
        <Textarea
          id="rawIdeaText"
          name="rawIdeaText"
          rows={4}
          placeholder="Describe the idea in your own words — this feeds the research and simulation stages later."
          required
        />
        <FieldError>{state.fieldErrors?.rawIdeaText}</FieldError>
      </div>
      {state.status === "error" && state.message && (
        <FieldError>{state.message}</FieldError>
      )}
      <SubmitButton />
    </form>
  );
}
