"use client";

import { useTransition } from "react";
import { Button, Spinner } from "@venture-sandbox/ui";
import { generateBuild } from "./actions";

export function GenerateButton({ ventureId }: { ventureId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      disabled={isPending}
      onClick={() => startTransition(() => generateBuild(ventureId))}
    >
      {isPending && <Spinner className="mr-2" />}
      {isPending ? "Generating..." : "Generate build plan"}
    </Button>
  );
}
