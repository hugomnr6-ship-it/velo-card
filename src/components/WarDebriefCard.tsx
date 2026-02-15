"use client";

import { IconCelebration, IconMuscle } from "@/components/icons/VeloIcons";

interface WarDebriefCardProps {
  myClubName: string;
  oppClubName: string;
  myScore: number;
  oppScore: number;
  weekLabel: string;
}

export default function WarDebriefCard({
  myClubName,
  oppClubName,
  myScore,
  oppScore,
  weekLabel,
}: WarDebriefCardProps) {
  const weekNum = weekLabel.split("-W")[1] || weekLabel;
  const isWin = myScore > oppScore;
  const isDraw = myScore === oppScore;

  return (
    <div
      className={`rounded-xl border p-5 text-center ${
        isWin
          ? "border-[#00F5D4]/30 bg-[#00F5D4]/5"
          : isDraw
            ? "border-white/[0.06] bg-[#111827]/50"
            : "border-red-700/30 bg-red-950/10"
      }`}
    >
      <div className="mb-1 text-3xl">
        {isWin ? <IconCelebration size={28} className="text-[#FFD700]" /> : isDraw ? <span className="text-2xl text-white/40">—</span> : <IconMuscle size={28} className="text-red-400" />}
      </div>
      <h3
        className={`text-lg font-bold font-[family-name:var(--font-family-title)] ${
          isWin ? "text-[#00F5D4]" : isDraw ? "text-white/80" : "text-red-400"
        }`}
      >
        {isWin ? "VICTOIRE !" : isDraw ? "MATCH NUL" : "DÉFAITE"}
      </h3>
      <p className="mt-1 text-sm text-[#94A3B8]">
        Semaine {weekNum} — {myClubName} vs {oppClubName}
      </p>
      <div className="mt-2 flex items-center justify-center gap-2">
        <span
          className={`text-2xl font-black font-[family-name:var(--font-family-data)] ${isWin ? "text-[#00F5D4]" : "text-white"}`}
        >
          {myScore}
        </span>
        <span className="text-[#475569]">—</span>
        <span
          className={`text-2xl font-black font-[family-name:var(--font-family-data)] ${!isWin && !isDraw ? "text-red-400" : "text-white"}`}
        >
          {oppScore}
        </span>
      </div>
      <p className="mt-2 text-xs text-[#475569]">
        {isWin
          ? "Bravo ! Ton club a dominé cette semaine"
          : isDraw
            ? "Égalité parfaite. La prochaine sera décisive !"
            : "On se relève et on revient plus fort mardi !"}
      </p>
    </div>
  );
}
