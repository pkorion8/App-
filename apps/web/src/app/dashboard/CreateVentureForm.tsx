"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, FieldError, Input, Label, Textarea } from "@venture-sandbox/ui";
import { createVenture, type CreateVentureState } from "./actions";

const initialState: CreateVentureState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} className="w-full">{pending ? "Getting your idea ready..." : "Start testing my idea →"}</Button>;
}

export function CreateVentureForm({ defaultName = "", defaultIdea = "" }: { defaultName?: string; defaultIdea?: string }) {
  const [state, formAction] = useFormState(createVenture, initialState);
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">Give your idea a name</Label>
        <Input id="name" name="name" defaultValue={defaultName} placeholder="e.g. Warranty reminder app" required />
        <p className="mt-1 text-xs text-vs-fg-muted">This can be temporary. You can change the idea later.</p>
        <FieldError>{state.fieldErrors?.name}</FieldError>
      </div>
      <div>
        <Label htmlFor="rawIdeaText">Describe it in your own words</Label>
        <Textarea id="rawIdeaText" name="rawIdeaText" defaultValue={defaultIdea} rows={5} placeholder="Example: I want an app where people can save a receipt and get reminded before a return, warranty or rebate deadline expires." required />
        <p className="mt-1 text-xs leading-5 text-vs-fg-muted">Two or three sentences are enough. Do not worry about business or technical terms.</p>
        <FieldError>{state.fieldErrors?.rawIdeaText}</FieldError>
      </div>
      {state.status === "error" && state.message && <FieldError>{state.message}</FieldError>}
      <SubmitButton />
    </form>
  );
}
