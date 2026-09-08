import { useId, type ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface FormFieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  /**
   * Render prop: pass the returned props to your control so the label,
   * hint and error are wired for assistive technology.
   */
  children: (fieldProps: {
    id: string;
    describedBy?: string;
    invalid: boolean;
  }) => ReactNode;
}

/**
 * Label + control + hint/error wiring in one accessible unit.
 *
 * Example:
 *   <FormField label="Email" required>
 *     {(field) => <Input {...field} type="email" aria-describedby={field.describedBy} aria-invalid={field.invalid} />}
 *   </FormField>
 */
export function FormField({ label, hint, error, required = false, className, children }: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-subtle-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
