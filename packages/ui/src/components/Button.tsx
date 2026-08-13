import type { ButtonHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-vs-primary text-vs-primary-fg shadow-sm hover:-translate-y-px hover:shadow-md disabled:translate-y-0 disabled:opacity-50",
  secondary:
    "border border-vs-border/80 bg-white text-vs-fg shadow-sm hover:border-vs-primary/30 hover:bg-vs-bg-subtle disabled:opacity-50",
  ghost: "text-vs-fg-muted hover:bg-white hover:text-vs-fg disabled:opacity-50",
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
