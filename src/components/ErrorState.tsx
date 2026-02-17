"use client";

import { m } from "framer-motion";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <m.div
      role="alert"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-red-900/40 bg-red-950/20 p-6 text-center"
    >
      <div className="mx-auto mb-3 text-3xl opacity-60">&#x26A0;</div>
      <p className="text-sm text-red-400">{message}</p>
      {onRetry && (
        <m.button
          whileTap={{ scale: 0.97 }}
          onClick={onRetry}
          className="mt-4 rounded-lg border border-red-800/50 bg-red-900/30 px-4 py-2 text-sm text-red-300 transition hover:bg-red-900/50"
        >
          Reessayer
        </m.button>
      )}
    </m.div>
  );
}
