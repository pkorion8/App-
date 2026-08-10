import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../utils/cn";

const fieldClasses =
  "w-full rounded-vs-sm border border-vs-border bg-vs-bg px-3 py-2 text-sm text-vs-fg placeholder:text-vs-fg-muted focus:outline-none focus:ring-2 focus:ring-vs-primary/40";

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
