"use client";

import { useIsPro } from "@/hooks/useSubscription";

export default function ProBadge() {
  const isPro = useIsPro();
  if (!isPro) return null;

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
      PRO
    </span>
  );
}
