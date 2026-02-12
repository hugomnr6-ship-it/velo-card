"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <p className="text-sm text-red-400">
        Erreur de chargement : {error.message}
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-neutral-800 px-4 py-2 text-sm text-white hover:bg-neutral-700"
      >
        Réessayer
      </button>
    </main>
  );
}
