"use client";

import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { PRO_GATES } from "@/lib/pro-gates";

// Icônes par feature
const featureIcons: Record<string, string> = {
  stats: "📊",
  duels: "⚔️",
  leaderboard: "🏆",
  quests: "🎯",
  share: "📤",
  gpx: "🗺️",
  routes: "🗺️",
};

// Titres contextuels par feature
const featureTitles: Record<string, string> = {
  stats: "Stats en temps reel avec Pro",
  duels: "Duels illimites avec Pro",
  leaderboard: "Classement complet avec Pro",
  quests: "Quetes illimitees avec Pro",
  share: "Partage sans watermark avec Pro",
  gpx: "Analyse complete avec Pro",
  routes: "Parcours illimites avec Pro",
};

interface ProGateOverlayProps {
  feature: keyof typeof PRO_GATES;
  trigger?: string;
  onClose: () => void;
}

/**
 * Overlay modal pour conversion Pro.
 * Apparait quand un free user atteint une limite.
 */
export default function ProGateOverlay({
  feature,
  trigger,
  onClose,
}: ProGateOverlayProps) {
  const prefersReduced = useReducedMotion();
  const gate = PRO_GATES[feature];
  const icon = featureIcons[feature] || "⭐";
  const title = featureTitles[feature] || "Passe Pro";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <m.div
          initial={prefersReduced ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Card */}
        <m.div
          initial={prefersReduced ? {} : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 mx-4 w-full max-w-sm rounded-2xl border border-[#6366F1]/20 bg-[#111827] p-6 shadow-2xl"
        >
          {/* Icône */}
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6366F1]/10 text-3xl">
              {icon}
            </div>
          </div>

          {/* Titre */}
          <h3 className="mb-2 text-center text-lg font-bold text-white">
            {title}
          </h3>

          {/* Trigger contextuel */}
          {trigger && (
            <p className="mb-3 text-center text-sm text-[#94A3B8]">
              {trigger}
            </p>
          )}

          {/* Description du bénéfice */}
          <p className="mb-4 text-center text-xs text-[#64748B]">
            {gate.proLabel}
          </p>

          {/* Badge essai gratuit */}
          <div className="mb-5 flex justify-center">
            <span className="rounded-full border border-[#00F5D4]/20 bg-[#00F5D4]/10 px-3 py-1 text-[11px] font-bold text-[#00F5D4]">
              7 jours gratuits
            </span>
          </div>

          {/* Boutons */}
          <div className="flex flex-col gap-2">
            <Link
              href="/pricing"
              className="flex w-full items-center justify-center rounded-xl bg-[#6366F1] py-3 text-sm font-bold text-white transition hover:bg-[#6366F1]/80 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
              onClick={onClose}
            >
              Essayer Pro
            </Link>
            <button
              onClick={onClose}
              className="w-full rounded-xl py-2.5 text-sm font-medium text-[#64748B] transition hover:text-[#94A3B8]"
            >
              Plus tard
            </button>
          </div>
        </m.div>
      </div>
    </AnimatePresence>
  );
}
