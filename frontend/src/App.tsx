import { Route, Routes } from "react-router-dom";
import { SiteLayout } from "./layouts/SiteLayout";
import { CartPage } from "./pages/CartPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { ProductsPage } from "./pages/ProductsPage";
import { SystemStatusPage } from "./pages/SystemStatusPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminRouteGuard } from "./components/admin/AdminRouteGuard";
import { AuthProvider } from "./context/AuthContext";

/**
 * Application routes.
 *
 * Public storefront routes use SiteLayout (Phase 2). Admin routes are outside the
 * site shell and wrapped in AuthProvider + AdminRouteGuard. Placeholder pages carry
 * honest "coming later" copy — no fake content.
 */
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public storefront */}
        <Route element={<SiteLayout />}>
          <Route index path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route
            path="/about"
            element={
              <PlaceholderPage
                title="About PlutoReso"
                description="The About page will tell the PlutoReso story once the owner supplies the business content through the admin workflow."
              />
            }
          />
          <Route
            path="/faq"
            element={
              <PlaceholderPage
                title="Frequently asked questions"
                description="The complete FAQ will be published here. The homepage already answers the most common delivery questions."
              />
            }
          />
          <Route
            path="/contact"
            element={
              <PlaceholderPage
                title="Contact us"
                description="Contact details and a contact form will be connected in a later phase. WhatsApp support will also be linked here once configured."
              />
            }
          />
          <Route
            path="/privacy"
            element={
              <PlaceholderPage
                title="Privacy Policy"
                description="Policy content is drafted with the owner and published before launch (required before Razorpay live activation)."
              />
            }
          />
          <Route
            path="/terms"
            element={
              <PlaceholderPage
                title="Terms & Conditions"
                description="Policy content is drafted with the owner and published before launch (required before Razorpay live activation)."
              />
            }
          />
          <Route
            path="/refund-policy"
            element={
              <PlaceholderPage
                title="Refund & Cancellation Policy"
                description="Policy content is drafted with the owner and published before launch (required before Razorpay live activation)."
              />
            }
          />
          <Route
            path="/delivery-policy"
            element={
              <PlaceholderPage
                title="Digital Delivery Policy"
                description="Explains how digital delivery works. Content is published before launch (required before Razorpay live activation)."
              />
            }
          />
          <Route path="/system-status" element={<SystemStatusPage />} />
        </Route>

        {/* Admin routes — outside the public site shell */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <AdminRouteGuard>
              <AdminDashboardPage />
            </AdminRouteGuard>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
