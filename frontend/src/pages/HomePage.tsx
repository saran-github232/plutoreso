import { SystemStatus } from "../components/SystemStatus";

export function HomePage() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
      <section className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
          Digital products platform
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Premium digital products, delivered instantly.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
          PlutoReso is an Indian digital-products store currently under active development. This is
          the Phase 1 application shell — the storefront, catalog, checkout and delivery experience
          arrive in upcoming phases.
        </p>
      </section>

      <SystemStatus />
    </main>
  );
}
