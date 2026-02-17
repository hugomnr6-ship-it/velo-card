"use client";

import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { useIsPro } from "@/hooks/useSubscription";

interface ProGateProps {
  children: React.ReactNode;
  feature: string;
  fallback?: React.ReactNode;
}

/**
 * Wraps content that requires Pro subscription.
 * Shows upgrade prompt for free users.
 */
export default function ProGate({ children, feature, fallback }: ProGateProps) {
  const isPro = useIsPro();
  const router = useRouter();

  if (isPro) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative rounded-2xl overflow-hidden"
    >
      {/* Blurred preview */}
      <div className="blur-sm pointer-events-none opacity-50">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm rounded-2xl">
        <div className="text-4xl mb-3" aria-hidden="true">&#x1F512;</div>
        <h3 className="text-lg font-bold text-white mb-2">Fonctionnalité Pro</h3>
        <p className="text-gray-400 text-sm text-center max-w-xs mb-4">
          {feature} est réservé aux membres Pro. 7 jours d&apos;essai gratuit !
        </p>
        <button
          onClick={() => router.push("/pricing")}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition"
        >
          Passer Pro &rarr;
        </button>
      </div>
    </m.div>
  );
}
