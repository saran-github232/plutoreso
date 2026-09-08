/**
 * Button styling recipe, kept separate from the Button component so router
 * `<Link>` elements can render as buttons without a runtime dependency.
 */
import { cn } from "../../lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "outlineInverse";

export type ButtonSize = "sm" | "md" | "lg";

const baseClasses =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary-600 text-white shadow-sm hover:bg-primary-700",
  secondary: "bg-primary-50 text-primary-700 hover:bg-primary-100",
  outline:
    "border border-border-strong bg-surface text-foreground hover:border-primary-300 hover:bg-primary-50/50",
  ghost: "text-muted-foreground hover:bg-slate-100 hover:text-foreground",
  destructive: "bg-danger text-white shadow-sm hover:bg-red-700",
  outlineInverse: "border border-white/25 text-white hover:bg-white/10"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base"
};

/** Full class recipe for a button variant/size (also usable on links). */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
): string {
  return cn(baseClasses, variantClasses[variant], sizeClasses[size], className);
}
