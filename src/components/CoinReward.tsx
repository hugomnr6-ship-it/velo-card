"use client";

import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import type { CoinRewardItem } from "@/contexts/CoinRewardContext";

interface CoinRewardProps {
  rewards: CoinRewardItem[];
}

/**
 * Bulle dorée "+50 🪙" qui scale up + float up + fade out.
 * Position fixe centrée, z-[100].
 */
export default function CoinReward({ rewards }: CoinRewardProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
      aria-live="polite"
    >
      <AnimatePresence>
        {rewards.map((r) => (
          <m.div
            key={r.id}
            role="status"
            aria-label={`+${r.amount} VeloCoins`}
            initial={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.5, y: 0 }
            }
            animate={
              reducedMotion
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.8, y: -60 }
            }
            transition={
              reducedMotion
                ? { duration: 0.15 }
                : { duration: 0.6, ease: "easeOut" }
            }
            className="absolute flex items-center gap-2 rounded-2xl border border-[#FFD700]/30 bg-[#0F172A]/90 px-5 py-3 shadow-[0_0_30px_rgba(255,215,0,0.2)] backdrop-blur-xl"
          >
            <span className="text-2xl">🪙</span>
            <span className="text-xl font-black text-[#FFD700] font-['JetBrains_Mono']">
              +{r.amount}
            </span>
            {r.source && (
              <span className="text-xs font-medium text-[#FFD700]/60">
                {r.source}
              </span>
            )}
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
