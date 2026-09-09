import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, ShoppingCart } from "lucide-react";
import { siteConfig } from "../../config/site";
import { cn } from "../../lib/cn";
import { useCart } from "../../context/useCart";
import { Container } from "../ui/Container";
import { Drawer } from "../ui/Drawer";
import { IconButton } from "../ui/IconButton";

const cartLinkClasses =
  "inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition duration-150 hover:bg-slate-100 hover:text-foreground";

/** Sticky application header: desktop nav + intentionally designed mobile drawer. */
export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useCart();
  const location = useLocation();

  // Close the mobile menu whenever navigation occurs.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const desktopLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
      isActive
        ? "bg-primary-50 text-primary-700"
        : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
    );

  const mobileLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      "rounded-lg px-3 py-2.5 text-base font-medium",
      isActive ? "bg-primary-50 text-primary-700" : "text-foreground hover:bg-slate-100"
    );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      <Container className="flex h-16 items-center justify-between gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md"
          aria-label={`${siteConfig.name} — home`}
        >
          <img src="/favicon.svg" alt="" width={28} height={28} className="rounded-md" />
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            {siteConfig.name}
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {siteConfig.nav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              className={desktopLinkClasses}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

                <div className="flex items-center gap-1.5">
                    <Link to="/cart" aria-label="Cart" className={cn(cartLinkClasses, "relative")}>
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {count > 0 ? (
              <span
                aria-label={`${count} item${count === 1 ? "" : "s"} in cart`}
                className="absolute -top-1 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium text-white"
              >
                {count}
              </span>
            ) : null}
          </Link>
          <IconButton
            className="md:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </IconButton>
        </div>
      </Container>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} label="Menu">
        <nav id="mobile-menu" aria-label="Main mobile" className="flex flex-col gap-1">
          {siteConfig.nav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              className={mobileLinkClasses}
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to="/cart"
            className="rounded-lg px-3 py-2.5 text-base font-medium text-foreground hover:bg-slate-100"
          >
            Cart
          </Link>
        </nav>
      </Drawer>
    </header>
  );
}
