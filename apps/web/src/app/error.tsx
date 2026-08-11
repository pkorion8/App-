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
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-vs-fg">Something went wrong</h1>
        <p className="mt-2 text-sm text-vs-fg-muted">
          That&apos;s on us, not something you did. Your data is safe — this page just hit an
          error rendering.
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
