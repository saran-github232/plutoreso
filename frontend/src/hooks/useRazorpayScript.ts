import { useEffect, useState } from "react";

/**
 * Loads the Razorpay Standard Checkout script safely.
 *
 * - Avoids duplicate script injection across re-renders/StrictMode.
 * - Reports loading failure so the UI can show a usable error state.
 * - Returns "loading" | "ready" | "error".
 *
 * The script URL is fixed by Razorpay. Only the Key ID, amount, and order
 * identity come from the server-provided checkout config — never hardcoded.
 */
type ScriptStatus = "loading" | "ready" | "error";

export function useRazorpayScript(): ScriptStatus {
  const [status, setStatus] = useState<ScriptStatus>(() => {
    if (typeof window === "undefined") {
      return "loading";
    }
    return (window as unknown as { Razorpay?: unknown }).Razorpay
      ? "ready"
      : "loading";
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
      setStatus("ready");
      return;
    }

    // Avoid duplicate injection.
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      // Script tag exists but may still be loading; poll for Razorpay global.
      const check = setInterval(() => {
        if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
          clearInterval(check);
          setStatus("ready");
        }
      }, 200);
      const timeout = setTimeout(() => {
        clearInterval(check);
        setStatus((prev) => (prev === "ready" ? prev : "error"));
      }, 10000);
      return () => {
        clearInterval(check);
        clearTimeout(timeout);
      };
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setStatus("ready");
    script.onerror = () => setStatus("error");
    document.body.appendChild(script);

    return () => {
      // Do not remove on cleanup — other components may need it.
    };
  }, []);

  return status;
}
