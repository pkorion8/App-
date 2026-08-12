"use client";

import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-vs-sm bg-vs-primary px-4 py-2 text-sm font-semibold text-vs-primary-fg disabled:opacity-50">{pending ? "Recording…" : "Submit answer"}</button>;
}

export function AnswerForm({ action, sessionId, ventureId }: { action: (formData: FormData) => void | Promise<void>; sessionId: string; ventureId: string }) {
  return <form action={action} className="space-y-3">
    <input type="hidden" name="sessionId" value={sessionId} />
    <input type="hidden" name="ventureId" value={ventureId} />
    <textarea name="answer" required rows={5} placeholder="Answer as you would in a real investor meeting." className="w-full rounded-vs-md border border-vs-border bg-vs-bg px-3 py-2 text-sm text-vs-fg" />
    <SubmitButton />
  </form>;
}
