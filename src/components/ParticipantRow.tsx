"use client";

import type { RaceParticipant, CardTier } from "@/types";

interface ParticipantRowProps {
  participant: RaceParticipant;
  index: number;
}

const tierColors: Record<CardTier, string> = {
  bronze: "text-amber-500 bg-amber-500/10 border-amber-800/50",
  argent: "text-slate-300 bg-slate-300/10 border-slate-600/50",
  platine: "text-[#A8D8EA] bg-[#A8D8EA]/10 border-[#A8D8EA]/30",
  diamant: "text-[#B9F2FF] bg-[#B9F2FF]/10 border-[#B9F2FF]/30",
  legende: "text-yellow-400 bg-yellow-400/10 border-yellow-600/50",
};

const tierRing: Record<CardTier, string> = {
  bronze: "border-amber-600",
  argent: "border-slate-400",
  platine: "border-[#A8D8EA]",
  diamant: "border-[#B9F2FF]",
  legende: "border-yellow-500",
};

const statColors: Record<CardTier, string> = {
  bronze: "text-amber-400",
  argent: "text-slate-200",
  platine: "text-[#A8D8EA]",
  diamant: "text-[#B9F2FF]",
  legende: "text-yellow-300",
};

export default function ParticipantRow({
  participant,
  index,
}: ParticipantRowProps) {
  const tier = participant.tier as CardTier;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-3">
      {/* Index */}
      <span className="w-6 text-center text-sm font-bold text-neutral-600">
        {index + 1}
      </span>

      {/* Avatar */}
      {participant.avatar_url ? (
        <img
          src={participant.avatar_url}
          alt=""
          className={`h-9 w-9 rounded-full border-2 ${tierRing[tier]}`}
        />
      ) : (
        <div
          className={`h-9 w-9 rounded-full border-2 bg-neutral-700 ${tierRing[tier]}`}
        />
      )}

      {/* Name + tier */}
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">
          {participant.username}
        </p>
        <span
          className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${tierColors[tier]}`}
        >
          {tier}
        </span>
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-xs">
        <div className="text-center">
          <p className={`font-bold ${statColors[tier]}`}>{participant.pac}</p>
          <p className="text-neutral-600">PAC</p>
        </div>
        <div className="text-center">
          <p className={`font-bold ${statColors[tier]}`}>{participant.end}</p>
          <p className="text-neutral-600">END</p>
        </div>
        <div className="text-center">
          <p className={`font-bold ${statColors[tier]}`}>{participant.mon}</p>
          <p className="text-neutral-600">MON</p>
        </div>
      </div>
    </div>
  );
}
