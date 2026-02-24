"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { useIsPro } from "@/hooks/useSubscription";
import ProPaywallModal from "@/components/ProPaywallModal";
import type { PRO_GATES } from "@/lib/pro-gates";

interface ProGateProps {
  children: React.ReactNode;
  /** Description de la feature Pro (affichée dans le CTA) */
  feature: string;
  /** Clé du gate pour le paywall modal contextuel */
  gateKey?: keyof typeof PRO_GATES;
  /** Contenu alternatif pour les free users (version limitée) */
  fallback?: React.ReactNode;
  /** Si true : bloque complètement avec overlay. Si false : montre + bandeau CTA. */
  block?: boolean;
}

/**
 * Gate Free/Pro réutilisable.
 * Règle CLAUDE.md : montrer la feature, flouter/limiter l'accès,
 * afficher un CTA "Passer Pro" contextuel. Ne jamais cacher complètement.
 */
export default function ProGate({ children, feature, gateKey, fallback, block = true }: ProGateProps) {
  const isPro = useIsPro();
  const [showPaywall, setShowPaywall] = useState(false);

  // Les Pro voient tout
  if (isPro) return <>{children}</>;

  // Mode non-bloquant : contenu limité + bandeau CTA
  if (!block) {
    return (
      <div>
        {fallback || children}
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center justify-between rounded-lg border border-[#6366F1]/15 bg-[#6366F1]/[0.05] px-4 py-2.5"
        >
          <p className="text-xs text-[#94A3B8]">{feature}</p>
          <button
            onClick={() => setShowPaywall(true)}
            className="shrink-0 rounded-md bg-[#6366F1] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#6366F1]/80"
          >
            Passer Pro
          </button>
        </m.div>
        {gateKey && (
          <ProPaywallModal
            isOpen={showPaywall}
            feature={gateKey}
            trigger={feature}
            onClose={() => setShowPaywall(false)}
          />
        )}
      </div>
    );
  }

  // Mode bloquant : contenu flouté + overlay CTA
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Contenu flouté (preview) */}
      <div className="pointer-events-none select-none blur-sm opacity-50">
        {fallback || children}
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#0D1117]/70 backdrop-blur-[2px]">
        <div className="rounded-xl border border-[#6366F1]/20 bg-[#111827]/90 px-6 py-5 text-center shadow-xl">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#6366F1]">
            Pro
          </p>
          <p className="mb-3 max-w-xs text-sm text-[#94A3B8]">
            {feature}
          </p>
          <p className="mb-4 text-[10px] text-[#64748B]">
            7 jours d&apos;essai gratuit
          </p>
          <button
            onClick={() => setShowPaywall(true)}
            className="inline-block rounded-lg bg-[#6366F1] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#6366F1]/80"
          >
            Passer Pro
          </button>
        </div>
      </div>

      {gateKey && (
        <ProPaywallModal
          isOpen={showPaywall}
          feature={gateKey}
          trigger={feature}
          onClose={() => setShowPaywall(false)}
        />
      )}
    </m.div>
  );
}
