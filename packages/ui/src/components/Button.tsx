import type { ButtonHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-vs-ink bg-vs-primary text-vs-primary-fg shadow-[0_5px_0_rgba(18,18,16,.12)] hover:-translate-y-0.5 hover:shadow-[0_7px_0_rgba(18,18,16,.12)] disabled:opacity-50",
  secondary:
    "border border-vs-ink/70 bg-white/55 text-vs-fg hover:bg-white disabled:opacity-50",
  ghost: "border border-transparent text-vs-fg hover:border-vs-border hover:bg-white/55 disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
