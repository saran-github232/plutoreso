import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

const fieldBase =
  "w-full rounded-lg border bg-surface px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-subtle-foreground disabled:cursor-not-allowed disabled:opacity-50";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, className, rows = 4, ...rest },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(fieldBase, "min-h-24 resize-y", invalid ? "border-danger" : "border-input", className)}
      {...rest}
    />
  );
});
