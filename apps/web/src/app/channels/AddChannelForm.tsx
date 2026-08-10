"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, FieldError, Input, Label } from "@venture-sandbox/ui";
import { addChannel, type AddChannelState } from "./actions";

const initialState: AddChannelState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding..." : "Add channel"}
    </Button>
  );
}

export function AddChannelForm() {
  const [state, formAction] = useFormState(addChannel, initialState);

  return (
    <form action={formAction} className="flex items-start gap-2">
      <div className="flex-1">
        <Label htmlFor="channelInput">Channel URL, @handle, or channel ID</Label>
        <Input
          id="channelInput"
          name="channelInput"
          placeholder="https://youtube.com/@channelname"
          required
        />
        {state.status === "error" && <FieldError>{state.message}</FieldError>}
      </div>
      <div className="pt-6">
        <SubmitButton />
      </div>
    </form>
  );
}
