import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

/** Horizontal hairline separator. */
export function Divider({ className, ...rest }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn("border-border", className)} {...rest} />;
}
