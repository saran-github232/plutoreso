import { useEffect, useState } from "react";
import { API_BASE_URL, fetchHealth, type HealthResponse } from "../lib/api";

type Status = "checking" | "online" | "offline";

const statusLabel: Record<Status, string> = {
  checking: "Checking…",
  online: "Connected",
  offline: "Offline"
};

const statusDot: Record<Status, string> = {
  checking: "bg-amber-400",
  online: "bg-emerald-500",
  offline: "bg-red-500"
};

/**
 * Phase 1 foundation check: verifies the frontend can reach the backend API
 * through the public VITE_API_URL configuration.
 */
export function SystemStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const timeout = setTimeout(() => controller.abort(), 5000);
    const startedAt = performance.now();

    fetchHealth(controller.signal)
      .then((data) => {
        if (cancelled) return;
        setHealth(data);
        setLatencyMs(Math.round(performance.now() - startedAt));
        setStatus("online");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.warn("[frontend] Backend health check failed:", error);
        setStatus("offline");
      })
      .finally(() => {
        clearTimeout(timeout);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return (
    <section
      aria-labelledby="system-status-heading"
      className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <h2 id="system-status-heading" className="text-base font-semibold text-slate-900">
        System status
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Phase 1 foundation check — verifies this frontend can reach the backend API.
      </p>

      <div className="mt-4 flex items-center gap-2" aria-live="polite">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${statusDot[status]}`}
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-slate-900">{statusLabel[status]}</span>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-4 sm:block">
          <dt className="text-slate-500">API base URL</dt>
          <dd className="break-all font-medium text-slate-900">{API_BASE_URL}</dd>
        </div>
        <div className="flex justify-between gap-4 sm:block">
          <dt className="text-slate-500">Backend environment</dt>
          <dd className="font-medium text-slate-900">{health?.environment ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4 sm:block">
          <dt className="text-slate-500">Response time</dt>
          <dd className="font-medium text-slate-900">
            {latencyMs !== null ? `${latencyMs} ms` : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-4 sm:block">
          <dt className="text-slate-500">Backend uptime</dt>
          <dd className="font-medium text-slate-900">{health ? `${health.uptimeSeconds} s` : "—"}</dd>
        </div>
      </dl>
    </section>
  );
}
