import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/** Reusable failure state with an optional retry action (Master Guide §42 copy). */
export function ErrorState({
  title = "Something went wrong",
  description = "Something went wrong while processing your request. Please try again or contact support.",
  onRetry,
  retryLabel = "Try again",
  className
}: ErrorStateProps) {
  const icon: ReactNode = <AlertTriangle />;
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-6 py-14 text-center",
        className
      )}
    >
      <div
        aria-hidden="true"
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger [&_svg]:h-6 [&_svg]:w-6"
      >
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {onRetry ? (
        <div className="mt-6">
          <Button variant="outline" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
