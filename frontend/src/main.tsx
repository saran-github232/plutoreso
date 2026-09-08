import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/inter";
import "@fontsource-variable/sora";
import App from "./App";
import { ToastProvider } from "./components/ui/Toast";
import { ScrollToTop } from "./lib/ScrollToTop";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found in index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <ScrollToTop />
        <App />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
