import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

const fieldBase =
  "h-10 w-full rounded-lg border bg-surface px-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-subtle-foreground disabled:cursor-not-allowed disabled:opacity-50";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(fieldBase, invalid ? "border-danger" : "border-input", className)}
      {...rest}
    />
  );
});
