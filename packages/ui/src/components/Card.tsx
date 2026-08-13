import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-vs-lg border border-vs-border/75 bg-white p-6 shadow-[var(--vs-shadow-card)]",
        className,
      )}
      {...props}
    />
  );
}
