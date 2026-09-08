import { cn } from "../../lib/cn";

/** Neutral loading placeholder block (pulse animation honors reduced motion). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-lg bg-slate-200/70", className)} />;
}
