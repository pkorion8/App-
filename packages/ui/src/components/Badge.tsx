import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type BadgeStatus = "neutral" | "primary" | "success" | "warning" | "danger";

const STATUS_CLASSES: Record<BadgeStatus, string> = {
  neutral: "border-vs-border bg-white/60 text-vs-fg-muted",
  primary: "border-vs-ink/10 bg-vs-lavender text-vs-ink",
  success: "border-vs-success/15 bg-vs-mint-soft text-vs-success",
  warning: "border-vs-warning/15 bg-vs-orange-soft text-vs-warning",
  danger: "border-vs-danger/15 bg-red-50 text-vs-danger",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatus;
}

export function Badge({ status = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[.12em]",
        STATUS_CLASSES[status],
        className,
      )}
      {...props}
    />
  );
}
