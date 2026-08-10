"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, FieldError, Input, Label } from "@venture-sandbox/ui";
import { sendSignInLink, type SignInState } from "./actions";

const initialState: SignInState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Sending..." : "Send sign-in link"}
    </Button>
  );
}

export function SignInForm() {
  const [state, formAction] = useFormState(sendSignInLink, initialState);

  if (state.status === "sent") {
    return (
      <p className="text-sm text-vs-success" role="status">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
        {state.status === "error" && (
          <FieldError>{state.message}</FieldError>
        )}
      </div>
      <SubmitButton />
    </form>
  );
}
