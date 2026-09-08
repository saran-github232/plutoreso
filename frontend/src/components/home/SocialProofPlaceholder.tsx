import { useId } from "react";
import { Quote } from "lucide-react";
import { Container } from "../ui/Container";

/**
 * Social-proof placeholder. Master Guide §37: no fake testimonials or
 * invented numbers — this space fills with real customer feedback later.
 */
export function SocialProofPlaceholder() {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="py-14 sm:py-16">
      <Container>
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-8 text-center sm:p-12">
          <div
            aria-hidden="true"
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"
          >
            <Quote className="h-6 w-6" />
          </div>
          <h2
            id={headingId}
            className="mt-4 font-display text-xl font-semibold text-foreground sm:text-2xl"
          >
            Customer stories will live here
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            We don&rsquo;t publish invented testimonials or sales numbers. Real customer feedback
            will appear in this space after launch.
          </p>
        </div>
      </Container>
    </section>
  );
}
