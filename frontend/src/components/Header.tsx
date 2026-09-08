export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2 rounded-md" aria-label="PlutoReso home">
          <img src="/favicon.svg" alt="" width={28} height={28} className="rounded-md" />
          <span className="text-lg font-semibold tracking-tight text-slate-900">PlutoReso</span>
        </a>
        <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          Foundation build
        </span>
      </div>
    </header>
  );
}
