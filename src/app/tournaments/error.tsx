'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function TournamentsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
      <div className="text-4xl">🎯</div>
      <h2 className="text-lg font-semibold text-[var(--text)]">Erreur des tournois</h2>
      <p className="text-sm text-[var(--text-muted)]">Impossible de charger les tournois.</p>
      <button onClick={reset} className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity">
        Réessayer
      </button>
    </div>
  );
}
