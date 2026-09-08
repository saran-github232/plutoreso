import { useCallback, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2 } from "lucide-react";
import { ToastContext, type ToastContextValue } from "./useToast";

interface ToastItem {
  id: number;
  message: string;
}

const TOAST_DURATION_MS = 4000;

/**
 * Minimal toast/notification foundation (polite status messages).
 * Auto-dismisses; respects reduced motion via the global rule.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback((message: string) => {
    setToasts((current) => {
      const id = (current[current.length - 1]?.id ?? 0) + 1;
      window.setTimeout(() => {
        setToasts((existing) => existing.filter((toast) => toast.id !== id));
      }, TOAST_DURATION_MS);
      return [...current, { id, message }];
    });
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0
        ? createPortal(
            <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:left-auto sm:right-6 sm:items-end">
              {toasts.map((toast) => (
                <div
                  key={toast.id}
                  role="status"
                  className="animate-toast-in pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  <span>{toast.message}</span>
                </div>
              ))}
            </div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
}
