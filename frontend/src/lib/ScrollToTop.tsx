import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Restores scroll position on SPA route changes. */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
