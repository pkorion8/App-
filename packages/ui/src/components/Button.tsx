import type { ButtonHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-vs-primary text-vs-primary-fg hover:opacity-90 disabled:opacity-50",
  secondary:
    "bg-vs-bg-subtle text-vs-fg border border-vs-border hover:bg-vs-border/40 disabled:opacity-50",
  ghost: "text-vs-fg hover:bg-vs-bg-subtle disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-vs-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
