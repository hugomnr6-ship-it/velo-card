"use client";

import type { LeaderboardEntry, CardTier } from "@/types";

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}

const tierColors: Record<CardTier, string> = {
  bronze: "text-amber-500 bg-amber-500/10 border-amber-800/50",
  argent: "text-slate-300 bg-slate-300/10 border-slate-600/50",
  platine: "text-[#A8D8EA] bg-[#A8D8EA]/10 border-[#A8D8EA]/30",
  diamant: "text-[#B9F2FF] bg-[#B9F2FF]/10 border-[#B9F2FF]/30",
  legende: "text-yellow-400 bg-yellow-400/10 border-yellow-600/50",
};

const rankColors: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-slate-300",
  3: "text-amber-600",
};

export default function LeaderboardRow({
  entry,
  isCurrentUser,
}: LeaderboardRowProps) {
  const tier = entry.tier as CardTier;

  return (
    <div
      className={`flex items-center gap-4 rounded-xl border p-3 ${
        isCurrentUser
          ? "border-[#00F5D4]/20 bg-[#00F5D4]/5"
          : "border-white/[0.06] bg-[#12121E] hover:bg-[#1A1A2E]"
      }`}
    >
      {/* Rank */}
      <span
        className={`w-8 text-center text-lg font-black ${rankColors[entry.rank] || "text-neutral-600"}`}
      >
        {entry.rank}
      </span>

      {/* Avatar */}
      {entry.avatar_url ? (
        <img src={entry.avatar_url} alt="" className="h-8 w-8 rounded-full" />
      ) : (
        <div className="h-8 w-8 rounded-full bg-neutral-700" />
      )}

      {/* Name + tier */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-white">
          {entry.username}
        </p>
        <span
          className={`inline-block rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${tierColors[tier]}`}
        >
          {tier}
        </span>
      </div>

      {/* Weekly stats */}
      <div className="flex gap-4 text-xs">
        <div className="text-center">
          <p className="font-bold text-white">{entry.weekly_km}</p>
          <p className="text-neutral-600">km</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-white">{entry.weekly_dplus}</p>
          <p className="text-neutral-600">D+</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-white">{entry.card_score}</p>
          <p className="text-neutral-600">score</p>
        </div>
      </div>
    </div>
  );
}
