import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10"
} as const;

export type IconButtonSize = keyof typeof sizeClasses;

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name — required because the control renders only an icon. */
  "aria-label": string;
  size?: IconButtonSize;
}

/** Square icon-only button; `aria-label` is required at the type level. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { size = "md", className, type = "button", children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-lg text-muted-foreground transition duration-150 hover:bg-slate-100 hover:text-foreground active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
