import type { SelectHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-vs-md border border-vs-border/80 bg-white px-4 py-3 text-sm text-vs-fg shadow-sm outline-none transition hover:border-vs-border focus:border-vs-primary/50 focus:ring-4 focus:ring-vs-primary/10",
        className,
      )}
      {...props}
    />
  );
}
