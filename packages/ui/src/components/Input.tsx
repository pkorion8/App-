import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../utils/cn";

const fieldClasses =
  "w-full rounded-vs-md border border-vs-border bg-white/75 px-4 py-3 text-sm text-vs-fg shadow-sm placeholder:text-vs-fg-muted/75 focus:border-vs-ink focus:outline-none focus:ring-2 focus:ring-vs-lavender";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClasses, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClasses, className)} {...props} />;
}
