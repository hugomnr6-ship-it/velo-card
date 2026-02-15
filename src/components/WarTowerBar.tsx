"use client";

import type { ReactNode } from "react";
import { IconTrophy } from "@/components/icons/VeloIcons";

interface WarTowerBarProps {
  icon: ReactNode;
  label: string;
  unit: string;
  myProgress: number;
  oppProgress: number;
  target: number;
  myWinner: boolean;
  oppWinner: boolean;
  myClubName: string;
  oppClubName: string;
}

export default function WarTowerBar({
  icon,
  label,
  unit,
  myProgress,
  oppProgress,
  target,
  myWinner,
  oppWinner,
  myClubName,
  oppClubName,
}: WarTowerBarProps) {
  const myPct = Math.min((myProgress / target) * 100, 100);
  const oppPct = Math.min((oppProgress / target) * 100, 100);

  const formatValue = (v: number) => {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return v % 1 === 0 ? String(Math.round(v)) : v.toFixed(1);
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111827]/60 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center">{icon}</span>
          <span className="text-sm font-semibold text-white">{label}</span>
        </div>
        <span className="text-xs text-[#94A3B8]">
          Objectif : {formatValue(target)} {unit}
        </span>
      </div>

      {/* My club bar */}
      <div className="mb-2">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-[#00F5D4]">
            {myClubName} {myWinner && <IconTrophy size={14} className="inline-block ml-1 text-[#FFD700]" />}
          </span>
          <span className="text-[#94A3B8] font-[family-name:var(--font-family-data)] text-[11px]">
            {formatValue(myProgress)} / {formatValue(target)} {unit} ({Math.round(myPct)}%)
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#1A1A2E]">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              myWinner
                ? "bg-gradient-to-r from-[#FDCB6E] to-[#FF6B6B]"
                : "bg-gradient-to-r from-[#6366F1] to-[#00F5D4]"
            }`}
            style={{ width: `${myPct}%` }}
          />
        </div>
      </div>

      {/* Opponent bar */}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-red-400">
            {oppClubName} {oppWinner && <IconTrophy size={14} className="inline-block ml-1 text-[#FFD700]" />}
          </span>
          <span className="text-[#94A3B8] font-[family-name:var(--font-family-data)] text-[11px]">
            {formatValue(oppProgress)} / {formatValue(target)} {unit} ({Math.round(oppPct)}%)
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#1A1A2E]">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              oppWinner
                ? "bg-gradient-to-r from-[#FDCB6E] to-[#FF6B6B]"
                : "bg-gradient-to-r from-red-600 to-red-400"
            }`}
            style={{ width: `${oppPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
