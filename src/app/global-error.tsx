"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="min-h-screen bg-[#0B1120] font-['Inter'] text-white antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
          <p className="text-lg font-bold">Une erreur est survenue</p>
          <p className="text-sm text-[#94A3B8]">
            Nous avons ete notifies. Reessaie dans quelques instants.
          </p>
          <button
            onClick={reset}
            className="mt-4 rounded-full bg-[#6366F1] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#5557E0]"
          >
            Reessayer
          </button>
        </main>
      </body>
    </html>
  );
}
