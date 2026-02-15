"use client";

import { useRouter } from "next/navigation";

export default function RetryButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.refresh()}
      className="rounded-lg bg-[#1A1A2E] px-4 py-2 text-sm text-white hover:bg-[#6366F1]/80"
    >
      Réessayer la synchronisation
    </button>
  );
}
