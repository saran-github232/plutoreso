export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-slate-500 sm:px-6">
        <p>© {year} PlutoReso. All rights reserved.</p>
        <p className="mt-1">
          Privacy, Terms and Refund Policy pages arrive with the storefront phases.
        </p>
      </div>
    </footer>
  );
}
