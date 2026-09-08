import { MessageCircle } from "lucide-react";
import { siteConfig, whatsappHref } from "../config/site";
import { buttonClasses } from "./ui/button-styles";
import { Badge } from "./ui/Badge";
import { Container } from "./ui/Container";

/**
 * WhatsApp support CTA (Master Guide §38: support channel, not sales infra).
 * The number comes from public configuration (VITE_WHATSAPP_NUMBER) — it is
 * never hardcoded. Until the business supplies it, an honest "coming soon"
 * state is shown instead.
 */
export function WhatsAppCta() {
  const href = whatsappHref(siteConfig.whatsappNumber, siteConfig.whatsappPrefillMessage);

  return (
    <section aria-labelledby="whatsapp-cta-heading" className="py-14 sm:py-16">
      <Container>
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-gradient-to-br from-primary-50 to-surface p-8 text-center shadow-card sm:p-10">
          <div
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-whatsapp/10 text-whatsapp"
          >
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 id="whatsapp-cta-heading" className="font-display text-xl font-semibold text-foreground sm:text-2xl">
              Questions? Talk to us on WhatsApp
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              {href
                ? "Chat with the PlutoReso team before or after your purchase."
                : "A WhatsApp support line will be connected here once the business support contact is configured."}
            </p>
          </div>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("primary", "lg")}
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Chat on WhatsApp
            </a>
          ) : (
            <Badge variant="neutral">Support contact coming soon</Badge>
          )}
        </div>
      </Container>
    </section>
  );
}
