"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button, FieldError, Input, Label, Select } from "@venture-sandbox/ui";
import { COUNTRY_OPTIONS } from "@venture-sandbox/research/geography";
import { startResearch, type StartResearchState } from "./actions";

const initialState: StartResearchState = { status: "idle" };

// Real stages of what startResearch actually does server-side (App Store +
// World Bank + GitHub calls in parallel, then a DB write) -- not decorative,
// each line is true of the request actually in flight.
const RESEARCH_STAGES = [
  "Searching the App Store for competitors…",
  "Pulling market data (population, GDP, internet access)…",
  "Scanning GitHub for related open-source projects…",
  "Comparing against this venture's last research run…",
  "Putting the results together…",
];
const STAGE_INTERVAL_MS = 1500;

function ResearchProgress() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, RESEARCH_STAGES.length - 1));
    }, STAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-4 rounded-vs-md border border-vs-border bg-vs-bg-subtle p-4" role="status" aria-live="polite">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-vs-primary/15">
        <div className="vs-progress-indeterminate h-full w-1/3 rounded-full bg-vs-primary" />
      </div>
      <p className="mt-2 text-xs text-vs-fg-muted">{RESEARCH_STAGES[stageIndex]}</p>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <div>
      <Button type="submit" disabled={pending}>
        {pending ? "Researching…" : "Start research"}
      </Button>
      {pending && <ResearchProgress />}
    </div>
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
