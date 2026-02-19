'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1.5rem', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ fontSize: '4rem' }}>💥</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Erreur critique</h2>
          <p style={{ fontSize: '0.875rem', color: '#888', maxWidth: '28rem', textAlign: 'center' }}>
            L&apos;application a rencontré une erreur critique. Veuillez rafraîchir la page.
          </p>
          <button
            onClick={reset}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', backgroundColor: '#ff6b00', color: 'white', fontWeight: '600', border: 'none', cursor: 'pointer' }}
          >
            Rafraîchir
          </button>
        </div>
      </body>
    </html>
  );
}
