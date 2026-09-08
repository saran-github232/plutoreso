import { Link } from "react-router-dom";
import { MessageCircle, ShieldCheck, Zap } from "lucide-react";
import { buttonClasses } from "../ui/button-styles";
import { Container } from "../ui/Container";

/** Premium dark hero — honest value messaging only (no invented claims). */
export function Hero() {
  return (
    <section className="hero-background" aria-labelledby="hero-heading">
      <Container className="py-16 sm:py-20 lg:py-28">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            Digital products platform — India
          </p>
          <h1
            id="hero-heading"
            className="mt-5 text-balance font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Premium digital products,{" "}
            <span className="bg-gradient-to-r from-primary-400 to-violet-400 bg-clip-text text-transparent">
              delivered instantly.
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            PlutoReso is a home for carefully crafted digital resources — templates, guides and
            toolkits. Browse the catalog, pay securely, and access your purchase digitally the
            moment it is verified.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/products" className={buttonClasses("primary", "lg")}>
              Browse products
            </Link>
            <Link to="/about" className={buttonClasses("outlineInverse", "lg")}>
              Learn more
            </Link>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary-400" aria-hidden="true" />
              Secure checkout
            </li>
            <li className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary-400" aria-hidden="true" />
              Instant digital delivery
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary-400" aria-hidden="true" />
              WhatsApp support
            </li>
          </ul>
        </div>
      </Container>
    </section>
  );
}
