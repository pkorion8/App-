"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, Card } from "@venture-sandbox/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Unhandled app error:", error);
  }, [error]);

  return (
    <main className="grid-paper flex min-h-screen items-center justify-center bg-vs-lavender-soft p-6">
      <Card className="max-w-md bg-white/85 text-center shadow-panel">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-vs-orange-soft text-xl" aria-hidden>!</span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-vs-fg">Something went wrong</h1>
        <p className="mt-2 text-sm text-vs-fg-muted">
          This page hit an unexpected error. Your saved venture data has not been removed.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={reset}>Try again</Button>
          <Link href="/dashboard">
            <Button variant="secondary">Back to your ventures</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
