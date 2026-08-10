"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, FieldError, Input, Label, Select, Textarea } from "@venture-sandbox/ui";
import { COUNTRY_OPTIONS } from "@venture-sandbox/research/geography";
import { saveShape, type SaveShapeState } from "./actions";

const initialState: SaveShapeState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save shape"}
    </Button>
  );
}

export function ShapeForm({
  ventureId,
  defaults,
}: {
  ventureId: string;
  defaults: {
    targetUser: string;
    geography: string;
    problemStatement: string;
    valueProposition: string;
    mvpScope: string;
    differentiation: string;
  };
}) {
  const boundAction = saveShape.bind(null, ventureId);
  const [state, formAction] = useFormState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="targetUser">Who is this for?</Label>
          <Input
            id="targetUser"
            name="targetUser"
            defaultValue={defaults.targetUser}
            placeholder="e.g. small salon owners"
            required
          />
          <FieldError>{state.fieldErrors?.targetUser}</FieldError>
        </div>
        <div>
          <Label htmlFor="geography">Where?</Label>
          <Select id="geography" name="geography" defaultValue={defaults.geography} required>
            <option value="" disabled>
              Choose a market
            </option>
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.code} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
          <FieldError>{state.fieldErrors?.geography}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="problemStatement">What problem does this solve?</Label>
        <Textarea
          id="problemStatement"
          name="problemStatement"
          rows={2}
          defaultValue={defaults.problemStatement}
          placeholder="The specific pain, for the specific person, today"
        />
      </div>

      <div>
        <Label htmlFor="valueProposition">Why would someone choose this?</Label>
        <Textarea
          id="valueProposition"
          name="valueProposition"
          rows={2}
          defaultValue={defaults.valueProposition}
          placeholder="The one-sentence reason this is worth switching to"
        />
      </div>

      <div>
        <Label htmlFor="mvpScope">What&apos;s actually in the first version?</Label>
        <Textarea
          id="mvpScope"
          name="mvpScope"
          rows={2}
          defaultValue={defaults.mvpScope}
          placeholder="The smallest thing worth shipping and testing"
        />
      </div>

      <div>
        <Label htmlFor="differentiation">What&apos;s different from what already exists?</Label>
        <Textarea
          id="differentiation"
          name="differentiation"
          rows={2}
          defaultValue={defaults.differentiation}
          placeholder="If nothing yet, say so honestly -- that's a real finding too"
        />
      </div>

      {state.status === "error" && state.message && <FieldError>{state.message}</FieldError>}
      {state.status === "success" && (
        <p className="text-sm text-vs-success">Saved.</p>
      )}
      <SubmitButton />
    </form>
  );
}
