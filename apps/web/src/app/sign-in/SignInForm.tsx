"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button, FieldError, Input, Label } from "@venture-sandbox/ui";
import { sendSignInLink, type SignInState } from "./actions";

const initialState: SignInState = { status: "idle" };

function SubmitButton({ waitSeconds }: { waitSeconds: number }) {
  const { pending } = useFormStatus();
  const blocked = pending || waitSeconds > 0;
  return (
    <Button type="submit" disabled={blocked} className="w-full">
      {pending
        ? "Sending..."
        : waitSeconds > 0
          ? `Try again in ${waitSeconds}s`
          : "Send sign-in link"}
    </Button>
  );
}

export function SignInForm({ next = "/dashboard" }: { next?: string }) {
  const [state, formAction] = useFormState(sendSignInLink, initialState);
  const [waitSeconds, setWaitSeconds] = useState(0);

  useEffect(() => {
    const nextWait = state.retryAfterSeconds ?? 0;
    setWaitSeconds(nextWait);
    if (nextWait <= 0) return;

    const timer = window.setInterval(() => {
      setWaitSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state.retryAfterSeconds]);

  if (state.status === "sent") {
    return (
      <div className="rounded-vs-md border border-vs-success/30 bg-vs-success/5 p-4" role="status">
        <p className="text-sm font-medium text-vs-success">{state.message}</p>
        <p className="mt-2 text-xs leading-5 text-vs-fg-muted">
          Keep this page open, then click the newest Sim Venture sign-in email. If you do not see it, check spam or promotions.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
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
        {state.status === "error" && state.retryAfterSeconds ? (
          <div className="mt-2 rounded-vs-md border border-vs-border bg-vs-bg-subtle p-3">
            <p className="text-sm text-vs-fg">{state.message}</p>
            <p className="mt-1 text-xs text-vs-fg-muted">
              {waitSeconds > 0 ? `You can request another link in ${waitSeconds} seconds.` : "You can request another link now."}
            </p>
          </div>
        ) : state.status === "error" ? (
          <FieldError>{state.message}</FieldError>
        ) : null}
      </div>
      <SubmitButton waitSeconds={waitSeconds} />
    </form>
  );
}
