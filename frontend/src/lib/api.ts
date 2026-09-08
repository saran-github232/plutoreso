/**
 * Public API base URL.
 * Only PUBLIC configuration may live in frontend env vars (Master Guide §34):
 * VITE_API_URL points at the backend API — never at private services or secrets.
 */
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:4000"
).replace(/\/+$/, "");

export interface HealthResponse {
  status: string;
  service: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
}

/** Fetches the backend health endpoint. Throws on network or HTTP failure. */
export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    headers: { Accept: "application/json" },
    signal
  });

  if (!response.ok) {
    throw new Error(`Health check failed (HTTP ${response.status})`);
  }

  return (await response.json()) as HealthResponse;
}
