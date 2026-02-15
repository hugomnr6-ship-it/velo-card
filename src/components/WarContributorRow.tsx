"use client";

import { IconMedalGold, IconMedalSilver, IconMedalBronze, IconLightning } from "@/components/icons/VeloIcons";

interface WarContributorRowProps {
  rank: number;
  username: string;
  avatarUrl: string | null;
  km: number;
  dplus: number;
  sprints: number;
}

export default function WarContributorRow({
  rank,
  username,
  avatarUrl,
  km,
  dplus,
  sprints,
}: WarContributorRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-[#111827]/40 px-3 py-2.5">
      {/* Rank */}
      <span className="w-6 text-center text-sm">
        {rank === 1 ? <IconMedalGold size={16} className="text-[#FFD700]" /> : rank === 2 ? <IconMedalSilver size={16} className="text-[#C0C0C0]" /> : rank === 3 ? <IconMedalBronze size={16} className="text-[#cd7f32]" /> : (
          <span className="text-xs text-[#475569]">{rank}</span>
        )}
      </span>

      {/* Avatar */}
      <div className="h-8 w-8 overflow-hidden rounded-full bg-[#1A1A2E]">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[#94A3B8]">
            {username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name */}
      <span className="flex-1 truncate text-sm font-medium text-white/90">
        {username}
      </span>

      {/* Stats */}
      <div className="flex items-center gap-3 text-[11px] text-[#94A3B8] font-[family-name:var(--font-family-data)]">
        <span title="Kilomètres">
          <span className="text-white/80">{km.toFixed(1)}</span> km
        </span>
        <span title="Dénivelé">
          <span className="text-white/80">{Math.round(dplus)}</span> m D+
        </span>
        <span title="Sprints">
          <span className="text-white/80">{sprints}</span> <IconLightning size={12} className="inline-block text-[#FFD700]" />
        </span>
      </div>
    </div>
  );
}
