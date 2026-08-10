import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-vs-lg border border-vs-border bg-vs-bg p-6 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
