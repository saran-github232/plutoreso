import { useId, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Container } from "./Container";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  /** Small overline above the title. */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Content rendered beside the heading on desktop (e.g. a "view all" link). */
  action?: ReactNode;
  /** Background tone — `surface` lifts the section onto a white band. */
  tone?: "default" | "surface";
  containerClassName?: string;
}

/** Consistent page section: spacing, container, and accessible heading. */
export function Section({
  eyebrow,
  title,
  description,
  action,
  tone = "default",
  className,
  containerClassName,
  children,
  id,
  ...rest
}: SectionProps) {
  const headingId = useId();

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("py-14 sm:py-16 lg:py-20", tone === "surface" && "bg-surface", className)}
      {...rest}
    >
      <Container className={containerClassName}>
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
                {eyebrow}
              </p>
            ) : null}
            <h2
              id={headingId}
              className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-3 text-base leading-7 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {children}
      </Container>
    </section>
  );
}
