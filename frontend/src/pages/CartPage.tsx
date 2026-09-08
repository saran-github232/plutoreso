import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { buttonClasses } from "../components/ui/button-styles";
import { Container } from "../components/ui/Container";
import { EmptyState } from "../components/ui/EmptyState";

/** Cart page foundation — honest empty state; cart logic arrives later. */
export function CartPage() {
  return (
    <Container className="py-16 sm:py-24">
      <EmptyState
        icon={<ShoppingCart />}
        title="Your cart is empty"
        description="Cart and checkout are being built in upcoming phases. Browse the catalog in the meantime."
        action={
          <Link to="/products" className={buttonClasses("primary", "md")}>
            Browse products
          </Link>
        }
      />
    </Container>
  );
}
