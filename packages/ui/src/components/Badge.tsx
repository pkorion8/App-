import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type BadgeStatus = "neutral" | "primary" | "success" | "warning" | "danger";

const STATUS_CLASSES: Record<BadgeStatus, string> = {
  neutral: "bg-vs-bg-subtle text-vs-fg-muted",
  primary: "bg-vs-primary/10 text-vs-primary",
  success: "bg-vs-success/10 text-vs-success",
  warning: "bg-vs-warning/10 text-vs-warning",
  danger: "bg-vs-danger/10 text-vs-danger",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatus;
}

export function Badge({ status = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-vs-sm px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
        STATUS_CLASSES[status],
        className,
      )}
      {...props}
    />
  );
}
