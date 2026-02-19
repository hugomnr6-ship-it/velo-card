'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
      <div className="text-6xl">😵</div>
      <h2 className="text-xl font-bold text-[var(--text)]">Quelque chose s&apos;est mal passé</h2>
      <p className="text-sm text-[var(--text-muted)] max-w-md text-center">
        Une erreur inattendue est survenue. Nos robots sont sur le coup.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold hover:opacity-90 transition-opacity"
      >
        Réessayer
      </button>
    </div>
  );
}
