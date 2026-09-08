import { useId } from "react";
import { CheckCircle2 } from "lucide-react";
import { Container } from "../ui/Container";

const reasons = [
  "Access is verified and unlocked automatically after payment.",
  "Mobile-first design that stays fast on any connection.",
  "Transparent INR pricing with clear discounts — no hidden costs.",
  "A catalog of practical, well-made digital resources."
] as const;

/** "Why PlutoReso" — platform facts only, no invented claims. */
export function WhyPlutoReso() {
  const headingId = useId();

  return (
    <section id="why-plutoreso" aria-labelledby={headingId} className="bg-surface py-14 sm:py-16 lg:py-20">
      <Container>
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
              Why PlutoReso
            </p>
            <h2
              id={headingId}
              className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
            >
              Built to make buying digital products simple
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              PlutoReso focuses on one thing: a reliable, honest way to buy quality digital
              products — with delivery that just works.
            </p>
          </div>
          <ul className="space-y-4">
            {reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                <span className="text-sm leading-6 text-foreground sm:text-base">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
