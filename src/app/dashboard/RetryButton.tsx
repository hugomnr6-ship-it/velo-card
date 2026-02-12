"use client";

import { useRouter } from "next/navigation";

export default function RetryButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.refresh()}
      className="rounded-lg bg-neutral-800 px-4 py-2 text-sm text-white hover:bg-neutral-700"
    >
      Réessayer la synchronisation
    </button>
  );
}
