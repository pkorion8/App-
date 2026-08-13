import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-vs-lg bg-vs-bg-subtle p-6",
        className,
      )}
      {...props}
    />
  );
}
