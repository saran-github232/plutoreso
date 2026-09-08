import { LifeBuoy, ShieldCheck, Zap } from "lucide-react";
import { Card } from "../ui/Card";
import { Container } from "../ui/Container";
import { useId } from "react";

const valueProps = [
  {
    icon: Zap,
    title: "Instant digital delivery",
    description:
      "Access is granted automatically the moment your payment is verified — nothing to wait for."
  },
  {
    icon: ShieldCheck,
    title: "Secure payments",
    description:
      "Checkout is protected with server-side verification, so a purchase is validated before delivery."
  },
  {
    icon: LifeBuoy,
    title: "Real human support",
    description: "Questions before or after a purchase? Reach the team on WhatsApp."
  }
] as const;

/** Value proposition strip beneath the hero. */
export function ValueProps() {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="py-14 sm:py-16">
      <Container>
        <h2 id={headingId} className="sr-only">
          Why buy from PlutoReso
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          {valueProps.map(({ icon: Icon, title, description }) => (
            <li key={title}>
              <Card className="h-full p-6">
                <div
                  aria-hidden="true"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600"
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
