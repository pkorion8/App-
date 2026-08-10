import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export function FieldError({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return (
    <p className={cn("mt-1 text-sm text-vs-danger", className)} {...props}>
      {children}
    </p>
  );
}
