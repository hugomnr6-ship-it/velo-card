"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StatDeltas, SpecialCardType } from "@/types";
import { IconChartUp, IconChartDown, IconArrowUp, IconArrowDown, IconFire, IconCelebration, SPECIAL_ICONS } from "@/components/icons/VeloIcons";

interface MondayUpdateBannerProps {
  deltas: StatDeltas;
  specialCard?: SpecialCardType | null;
  streak?: number;
}

const specialCardLabels: Record<SpecialCardType, { label: string; iconKey: string; color: string }> = {
  totw: { label: "L'ÉCHAPPÉE DE LA SEMAINE", iconKey: "totw", color: "#FFD700" },
  in_form: { label: "IN FORM", iconKey: "in_form", color: "#FF6B35" },
  legend_moment: { label: "MOMENT LÉGENDE", iconKey: "legend_moment", color: "#B9F2FF" },
};

function DeltaChip({ label, value }: { label: string; value: number }) {
  if (value === 0) return null;
  const isPositive = value > 0;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
        isPositive
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-red-500/15 text-red-400"
      }`}
    >
      <span className="text-white/50">{label}</span>
      <span className="inline-flex items-center">{isPositive ? <IconArrowUp size={10} /> : <IconArrowDown size={10} />}</span>{Math.abs(value)}
    </span>
  );
}

export default function MondayUpdateBanner({
  deltas,
  specialCard,
  streak = 0,
}: MondayUpdateBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const isPositive = deltas.ovr > 0;
  const special = specialCard ? specialCardLabels[specialCard] : null;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="w-full max-w-md"
        >
          <div
            className={`relative overflow-hidden rounded-2xl border p-4 ${
              isPositive
                ? "border-emerald-500/20 bg-emerald-950/30"
                : "border-red-500/20 bg-red-950/30"
            }`}
          >
            {/* Close button */}
            <button
              onClick={() => setDismissed(true)}
              className="absolute right-3 top-3 text-white/30 hover:text-white/60 transition"
            >
              \u2715
            </button>

            {/* Special card badge */}
            {special && (
              <div
                className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black tracking-wider"
                style={{
                  color: special.color,
                  backgroundColor: `${special.color}15`,
                  border: `1px solid ${special.color}40`,
                }}
              >
                <span className="flex items-center">{(() => { const SIcon = SPECIAL_ICONS[special.iconKey]; return SIcon ? <SIcon size={14} style={{ color: special.color }} /> : null; })()}</span>
                {special.label}
              </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-2">
              <span className="text-lg flex items-center">
                {isPositive ? <IconChartUp size={20} className="text-emerald-400" /> : <IconChartDown size={20} className="text-red-400" />}
              </span>
              <div>
                <p className="text-sm font-bold text-white">
                  Monday Update
                </p>
                <p className="text-xs text-white/50">
                  Ta carte a {isPositive ? "progressé" : "baissé"} cette semaine
                </p>
              </div>
            </div>

            {/* OVR Delta — big number */}
            <div className="mt-3 flex items-center gap-3">
              <span
                className={`text-3xl font-black font-['JetBrains_Mono'] ${
                  isPositive ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {isPositive ? "+" : ""}{deltas.ovr}
              </span>
              <span className="text-sm text-white/40">OVR</span>

              {/* Streak badge */}
              {streak > 1 && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                  <IconFire size={12} className="inline-block mr-1" />{streak} semaines
                </span>
              )}
            </div>

            {/* Stat deltas */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <DeltaChip label="VIT" value={deltas.pac} />
              <DeltaChip label="MON" value={deltas.mon} />
              <DeltaChip label="TEC" value={deltas.val} />
              <DeltaChip label="SPR" value={deltas.spr} />
              <DeltaChip label="END" value={deltas.end} />
              <DeltaChip label="PUI" value={deltas.res} />
            </div>

            {/* Tier change */}
            {deltas.tierChanged && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-3 rounded-lg bg-white/5 p-2 text-center"
              >
                <p className="text-xs font-bold text-white/80">
                  {isPositive ? <><IconCelebration size={14} className="inline-block mr-1" />Changement de tier !</> : "Tier modifié"}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
