import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type CheckboxProps = InputHTMLAttributes<HTMLInputElement>;

/** Native checkbox styled via accent color — accessible by default. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, type = "checkbox", ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn("h-4 w-4 shrink-0 accent-primary-600", className)}
      {...rest}
    />
  );
});
