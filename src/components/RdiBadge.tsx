"use client";

import type { RdiResult, RdiLabel, CardTier } from "@/types";

interface RdiBadgeProps {
  rdi: RdiResult;
  tier: CardTier;
}

const labelColors: Record<RdiLabel, string> = {
  Facile: "text-emerald-400",
  "Modéré": "text-amber-400",
  Difficile: "text-orange-400",
  "Extrême": "text-red-400",
};

const tierBg: Record<CardTier, string> = {
  bronze: "bg-amber-900/30",
  argent: "bg-slate-700/30",
  platine: "bg-sky-900/30",
  diamant: "bg-cyan-900/30",
  legende: "bg-yellow-900/30",
};

export default function RdiBadge({ rdi, tier }: RdiBadgeProps) {
  return (
    <div className="flex flex-col items-center">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8]">
        Difficulté
      </p>
      <div
        className={`stat-badge flex h-[110px] w-[100px] flex-col items-center justify-center ${tierBg[tier]}`}
      >
        <span className={`text-3xl font-black ${labelColors[rdi.label]}`}>
          {rdi.score}
        </span>
        <span className="mt-0.5 text-[9px] font-bold tracking-wider text-white/50">
          RDI / 10
        </span>
      </div>
      <p className={`mt-2 text-sm font-semibold ${labelColors[rdi.label]}`}>
        {rdi.label}
      </p>
    </div>
  );
}
