import { Link } from "react-router-dom";
import { PackageOpen } from "lucide-react";
import { buttonClasses } from "../ui/button-styles";
import { Card } from "../ui/Card";
import { Container } from "../ui/Container";

/** Honest placeholder for the future bundles area (Master Guide §16 rules). */
export function BundlesTeaser() {
  return (
    <section aria-labelledby="bundles-heading" className="py-14 sm:py-16">
      <Container>
        <Card className="flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
          <div
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600"
          >
            <PackageOpen className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
              Coming soon
            </p>
            <h2 id="bundles-heading" className="mt-1 font-display text-xl font-semibold text-foreground sm:text-2xl">
              Bundles &amp; bonus offers
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Configurable bundle and bonus rules are part of the PlutoReso platform. This space
              will showcase bundle offers once the catalog is live.
            </p>
          </div>
          <Link to="/products" className={buttonClasses("outline", "md")}>
            Browse products
          </Link>
        </Card>
      </Container>
    </section>
  );
}
