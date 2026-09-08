import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { siteConfig, whatsappHref, type NavLinkItem } from "../../config/site";
import { Container } from "../ui/Container";

function FooterNav({ heading, links }: { heading: string; links: readonly NavLinkItem[] }) {
  return (
    <nav aria-label={heading}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{heading}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              to={item.href}
              className="text-sm text-slate-300 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Site footer with future-ready link groups (policies published pre-launch). */
export function Footer() {
  const whatsapp = whatsappHref(siteConfig.whatsappNumber, siteConfig.whatsappPrefillMessage);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="" width={28} height={28} className="rounded-md" />
              <span className="font-display text-lg font-semibold tracking-tight text-white">
                {siteConfig.name}
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
              {siteConfig.description}
            </p>
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp support
              </a>
            ) : null}
          </div>

          <FooterNav heading="Shop" links={siteConfig.footer.shop} />
          <FooterNav heading="Company" links={siteConfig.footer.company} />

          <div>
            <FooterNav heading="Legal" links={siteConfig.footer.legal} />
            <p className="mt-6 text-xs text-slate-500">
              System status:{" "}
              <Link
                to="/system-status"
                className="underline underline-offset-2 transition-colors hover:text-slate-300"
              >
                check backend
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 text-xs text-slate-500">
          <p>© {year} {siteConfig.name}. All rights reserved.</p>
          <p className="mt-1">
            Storefront under active development — catalog, cart and checkout arrive in upcoming phases.
          </p>
        </div>
      </Container>
    </footer>
  );
}
