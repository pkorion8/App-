import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../utils/cn";

const fieldClasses =
  "w-full rounded-vs-md border border-vs-border/80 bg-white px-4 py-3 text-sm text-vs-fg shadow-sm outline-none transition placeholder:text-vs-fg-muted/70 hover:border-vs-border focus:border-vs-primary/50 focus:ring-4 focus:ring-vs-primary/10";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClasses, "resize-y", className)} {...props} />;
}
