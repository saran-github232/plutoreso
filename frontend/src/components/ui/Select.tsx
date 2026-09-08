import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

const fieldBase =
  "h-10 w-full rounded-lg border bg-surface px-3 pr-8 text-sm text-foreground shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

/** Native select (kept native for accessibility and mobile UX). */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid = false, className, children, ...rest },
  ref
) {
  return (
    <select
      ref={ref}
      className={cn(fieldBase, invalid ? "border-danger" : "border-input", className)}
      {...rest}
    >
      {children}
    </select>
  );
});
