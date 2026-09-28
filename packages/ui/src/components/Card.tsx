import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "vs-panel-shadow rounded-vs-lg border border-vs-border bg-white/70 p-6",
        className,
      )}
      {...props}
    />
  );
}
