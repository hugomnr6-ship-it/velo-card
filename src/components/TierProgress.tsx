"use client";

import { motion } from "framer-motion";
import type { CardTier } from "@/types";

interface TierProgressProps {
  ovr: number;
  tier: CardTier;
}

const tierAccentHex: Record<CardTier, string> = {
  bronze: "#E8A854",
  argent: "#B8A0D8",
  platine: "#E0E8F0",
  diamant: "#00D4FF",
  legende: "#FFD700",
};

const tierThresholds: Record<
  CardTier,
  { min: number; max: number; next: CardTier | null; nextLabel: string }
> = {
  bronze: { min: 0, max: 49, next: "argent", nextLabel: "Argent" },
  argent: { min: 50, max: 64, next: "platine", nextLabel: "Platine" },
  platine: { min: 65, max: 79, next: "diamant", nextLabel: "Diamant" },
  diamant: { min: 80, max: 89, next: "legende", nextLabel: "Legende" },
  legende: { min: 90, max: 99, next: null, nextLabel: "MAX" },
};

const tierLabel: Record<CardTier, string> = {
  bronze: "Bronze",
  argent: "Argent",
  platine: "Platine",
  diamant: "Diamant",
  legende: "Legende",
};

const tierEmoji: Record<CardTier, string> = {
  bronze: "\uD83E\uDD49",
  argent: "\u26AA",
  platine: "\uD83D\uDCA0",
  diamant: "\uD83D\uDC8E",
  legende: "\uD83D\uDC51",
};

export default function TierProgress({ ovr, tier }: TierProgressProps) {
  const t = tierThresholds[tier];
  const accent = tierAccentHex[tier];
  const nextAccent = t.next ? tierAccentHex[t.next] : accent;

  // Compute fill percentage
  const range = t.max - t.min + 1;
  const progress = tier === "legende" ? 100 : Math.min(100, Math.round(((ovr - t.min) / range) * 100));

  const remaining = t.next ? t.max + 1 - ovr : 0;

  return (
    <div className="w-full max-w-md rounded-xl border border-white/[0.06] bg-[#16161F]/60 p-3">
      {/* Labels */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{tierEmoji[tier]}</span>
          <span className="text-[10px] font-bold" style={{ color: accent }}>
            {tierLabel[tier]}
          </span>
        </div>

        <span className="text-[11px] font-black font-['JetBrains_Mono'] text-white/60">
          {ovr}
          <span className="text-white/25">/{t.next ? t.max + 1 : "99"}</span>
          <span className="text-[9px] font-bold text-white/25 ml-1">OVR</span>
        </span>

        <div className="flex items-center gap-1.5">
          {t.next ? (
            <>
              <span className="text-[10px] font-bold" style={{ color: nextAccent }}>
                {t.nextLabel}
              </span>
              <span className="text-xs">{tierEmoji[t.next]}</span>
            </>
          ) : (
            <span className="text-[10px] font-bold text-[#FFD700]">MAX</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          style={{
            background: `linear-gradient(90deg, ${accent}90, ${accent})`,
            boxShadow: `0 0 8px ${accent}40`,
          }}
        />
      </div>

      {/* Info text */}
      {t.next && remaining > 0 && (
        <p className="mt-1.5 text-center text-[9px] text-white/25">
          Encore {remaining} OVR pour atteindre {t.nextLabel}
        </p>
      )}
      {tier === "legende" && (
        <p className="mt-1.5 text-center text-[9px] text-[#FFD700]/50">
          Tier maximum atteint !
        </p>
      )}
    </div>
  );
}
