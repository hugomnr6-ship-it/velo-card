"use client";

import type { LeaderboardEntry, CardTier } from "@/types";
import { tierConfig, tierBorderColors } from "./VeloCard";

interface PodiumProps {
  entries: LeaderboardEntry[];
}

const tierAccentHex: Record<CardTier, string> = {
  bronze: "#cd7f32",
  argent: "#C0C0C0",
  platine: "#A8D8EA",
  diamant: "#B9F2FF",
  legende: "#FFD700",
};

const rankEmojis = ["", "\ud83e\udd47", "\ud83e\udd48", "\ud83e\udd49"];

export default function Podium({ entries }: PodiumProps) {
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) return null;

  // Order: #2, #1, #3
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="mb-6 flex items-end justify-center gap-3">
      {order.map((entry, i) => {
        if (!entry) return null;
        const isFirst = entry.rank === 1;
        const tier = entry.tier as CardTier;
        const config = tierConfig[tier];
        const accent = tierAccentHex[tier];
        const cardH = isFirst ? 128 : 100;
        const cardW = isFirst ? 88 : 72;

        return (
          <div key={entry.user_id} className="flex flex-col items-center">
            {/* Rank emoji */}
            <span className="mb-1 text-lg">{rankEmojis[entry.rank]}</span>

            {/* Mini card */}
            <div
              className={`relative overflow-hidden rounded-xl border bg-gradient-to-b ${config.bg} ${tierBorderColors[tier]} ${config.glowClass}`}
              style={{ width: cardW, height: cardH }}
            >
              <div className="scan-lines pointer-events-none absolute inset-0 rounded-xl" />
              <div className="relative z-10 flex h-full flex-col items-center justify-center px-1">
                {entry.avatar_url ? (
                  <img
                    src={entry.avatar_url}
                    alt=""
                    className="h-7 w-7 rounded-full border border-white/20 object-cover"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-white/10" />
                )}
                <span
                  className="mt-1.5 text-[18px] font-black leading-none font-['JetBrains_Mono']"
                  style={{ color: accent }}
                >
                  {entry.ovr || entry.card_score}
                </span>
                <span className="mt-0.5 max-w-full truncate text-[8px] font-semibold text-white/60">
                  {entry.username}
                </span>
              </div>
            </div>

            {/* Pedestal */}
            <div
              className="mt-1 rounded-t-md"
              style={{
                width: cardW,
                height: isFirst ? 32 : entry.rank === 2 ? 20 : 12,
                background: `linear-gradient(180deg, ${accent}30, ${accent}10)`,
                borderLeft: `1px solid ${accent}20`,
                borderRight: `1px solid ${accent}20`,
                borderTop: `1px solid ${accent}30`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
