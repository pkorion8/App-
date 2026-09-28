import type { SelectHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-vs-md border border-vs-border bg-white/75 px-4 py-3 text-sm text-vs-fg shadow-sm focus:border-vs-ink focus:outline-none focus:ring-2 focus:ring-vs-lavender",
        className,
      )}
      {...props}
    />
  );
}
