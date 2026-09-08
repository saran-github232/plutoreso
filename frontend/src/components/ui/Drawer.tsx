import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { IconButton } from "./IconButton";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Accessible dialog name; also shown as the drawer title. */
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * Right-side slide-over used by the mobile navigation.
 * Closes on Escape / overlay click, locks body scroll, and moves focus to
 * the close button while open. (A full modal with focus trap arrives with
 * the admin phases; this covers the storefront drawer need.)
 */
export function Drawer({ open, onClose, label, children, className }: DrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
      <div
        className="animate-overlay-in absolute inset-0 bg-slate-950/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "animate-drawer-in absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-surface-raised shadow-drawer",
          className
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <span className="font-display text-base font-semibold text-foreground">{label}</span>
          <IconButton ref={closeRef} aria-label="Close menu" onClick={onClose}>
            <X className="h-5 w-5" aria-hidden="true" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
