import { useId } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Container } from "../ui/Container";

const faqs = [
  {
    question: "What are digital products?",
    answer:
      "Digital products are files and resources — such as templates, guides and toolkits — that you access online or download. Nothing is shipped physically."
  },
  {
    question: "How is my purchase delivered?",
    answer:
      "Everything is delivered digitally. Once your payment is verified, access to your purchase is unlocked automatically — no waiting for delivery."
  },
  {
    question: "When does the full store launch?",
    answer:
      "The storefront is under active development. The product catalog, cart and checkout are being added phase by phase."
  }
] as const;

/** FAQ preview using native details/summary (accessible, JS-free). */
export function FaqPreview() {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="py-14 sm:py-16 lg:py-20">
      <Container className="max-w-3xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Support</p>
          <h2
            id={headingId}
            className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            Frequently asked questions
          </h2>
        </div>

        <div className="mt-8 divide-y divide-border rounded-xl border border-border bg-surface shadow-card">
          {faqs.map((faq) => (
            <details key={faq.question} className="group px-5 sm:px-6">
              <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 text-sm font-semibold text-foreground sm:text-base">
                {faq.question}
                <Plus
                  className="h-4 w-4 shrink-0 text-subtle-foreground transition-transform duration-200 group-open:rotate-45"
                  aria-hidden="true"
                />
              </summary>
              <p className="pb-4 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          More questions?{" "}
          <Link
            to="/contact"
            className="font-medium text-primary-700 underline underline-offset-2 transition-colors hover:text-primary-800"
          >
            Contact us
          </Link>
        </p>
      </Container>
    </section>
  );
}
