import type { SelectHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-vs-sm border border-vs-border bg-vs-bg px-3 py-2 text-sm text-vs-fg focus:outline-none focus:ring-2 focus:ring-vs-primary/40",
        className,
      )}
      {...props}
    />
  );
}
