"use client";

import { memo } from "react";
import Image from "next/image";
import type { LeaderboardEntry, CardTier } from "@/types";

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}

const tierColors: Record<CardTier, string> = {
  bronze: "text-amber-500 bg-amber-500/10 border-amber-800/50",
  argent: "text-slate-300 bg-slate-300/10 border-slate-600/50",
  platine: "text-[#E0E8F0] bg-[#E0E8F0]/10 border-[#E0E8F0]/30",
  diamant: "text-[#B9F2FF] bg-[#B9F2FF]/10 border-[#B9F2FF]/30",
  legende: "text-yellow-400 bg-yellow-400/10 border-yellow-600/50",
};

const rankColors: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-slate-300",
  3: "text-amber-600",
};

/* Mini-card background per tier */
const miniCardBg: Record<CardTier, string> = {
  bronze: "bg-gradient-to-b from-[#1A1208] to-[#2D1F0E]",
  argent: "bg-gradient-to-b from-[#14141E] to-[#1E1E2E]",
  platine: "bg-gradient-to-b from-[#1A1A2E] to-[#2A2A42]",
  diamant: "bg-gradient-to-b from-[#0A1628] to-[#162040]",
  legende: "bg-gradient-to-b from-[#1A0A2E] to-[#2E1A0A]",
};

const miniCardBorder: Record<CardTier, string> = {
  bronze: "border-[#cd7f32]/40",
  argent: "border-[#B8A0D8]/30",
  platine: "border-[#E0E8F0]/30",
  diamant: "border-[#B9F2FF]/30",
  legende: "border-[#ffd700]/40",
};

const miniCardAccent: Record<CardTier, string> = {
  bronze: "text-[#cd7f32]",
  argent: "text-[#B8A0D8]",
  platine: "text-[#E0E8F0]",
  diamant: "text-[#B9F2FF]",
  legende: "text-[#FFD700]",
};

export default memo(function LeaderboardRow({
  entry,
  isCurrentUser,
}: LeaderboardRowProps) {
  const tier = entry.tier as CardTier;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 ${
        isCurrentUser
          ? "border-[#00F5D4]/20 bg-[#00F5D4]/5"
          : "border-white/[0.06] bg-[#111827] hover:bg-[#1A1A2E]"
      }`}
    >
      {/* Rank */}
      <span
        className={`w-7 text-center text-lg font-black font-['JetBrains_Mono'] ${rankColors[entry.rank] || "text-[#475569]"}`}
      >
        {entry.rank}
      </span>

      {/* Mini-card (36x52px) — replaces simple avatar */}
      <div
        className={`relative flex h-[52px] w-[36px] flex-shrink-0 flex-col items-center justify-center overflow-hidden rounded-md border ${miniCardBg[tier]} ${miniCardBorder[tier]}`}
      >
        {/* Scan-lines micro */}
        <div className="scan-lines pointer-events-none absolute inset-0 opacity-50" />

        {/* Avatar mini */}
        {entry.avatar_url ? (
          <Image
            src={entry.avatar_url}
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 rounded-full border border-white/20 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-5 w-5 rounded-full bg-[#6366F1]" />
        )}

        {/* OVR mini */}
        <span
          className={`mt-0.5 text-[9px] font-black leading-none font-['JetBrains_Mono'] ${miniCardAccent[tier]}`}
        >
          {entry.ovr}
        </span>

        {/* Tier label micro */}
        <span className="text-[5px] font-bold uppercase tracking-wider text-white/30">
          {tier.slice(0, 3)}
        </span>
      </div>

      {/* Name + tier badge */}
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

      {/* OVR score */}
      <div className="text-center text-xs">
        <p className="font-bold text-white font-['JetBrains_Mono'] text-base">{entry.ovr}</p>
        <p className="text-[#475569]">OVR</p>
      </div>
    </div>
  );
});
