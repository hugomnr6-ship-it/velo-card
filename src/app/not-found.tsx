import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
      <div className="text-8xl font-bold text-[var(--accent)]">404</div>
      <h2 className="text-xl font-bold text-[var(--text)]">Page introuvable</h2>
      <p className="text-sm text-[var(--text-muted)] max-w-md text-center">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/dashboard"
        className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold hover:opacity-90 transition-opacity"
      >
        Retour au dashboard
      </Link>
    </div>
  );
}
