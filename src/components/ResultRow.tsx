"use client";

import Link from "next/link";
import type { RaceResultView } from "@/types";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

const positionBadge: Record<number, string> = {
  1: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  2: "bg-neutral-400/20 text-neutral-300 border-neutral-400/40",
  3: "bg-orange-700/20 text-orange-400 border-orange-700/40",
};

const tierColors: Record<string, string> = {
  bronze: "text-[#cd7f32]",
  argent: "text-[#bdc3c7]",
  platine: "text-[#A8D8EA]",
  diamant: "text-[#B9F2FF]",
  legende: "text-[#ffd700]",
};

const tierBg: Record<string, string> = {
  bronze: "bg-[#cd7f32]/10 border-[#cd7f32]/30",
  argent: "bg-[#bdc3c7]/10 border-[#bdc3c7]/30",
  platine: "bg-[#A8D8EA]/10 border-[#A8D8EA]/30",
  diamant: "bg-[#B9F2FF]/10 border-[#B9F2FF]/30",
  legende: "bg-[#ffd700]/10 border-[#ffd700]/30",
};

interface ResultRowProps {
  result: RaceResultView;
  currentUserId?: string | null;
}

export default function ResultRow({ result, currentUserId }: ResultRowProps) {
  const badgeClass =
    positionBadge[result.position] ||
    "bg-neutral-800/50 text-neutral-500 border-neutral-700/50";

  const isCurrentUser = currentUserId && result.user_id === currentUserId;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        isCurrentUser
          ? "border-white/20 bg-white/5"
          : "border-neutral-700/50 bg-neutral-800/50"
      }`}
    >
      {/* Position badge */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-bold ${badgeClass}`}
      >
        {result.position}
      </div>

      {/* Avatar */}
      {result.is_ghost ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-700/50">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-neutral-500"
          >
            <path d="M12 2C7.58 2 4 5.58 4 10v10.5c0 .83 1 1.5 1.5 1.5s1-.67 1.5-1.5 1-1.5 1.5-1.5 1 .67 1.5 1.5.67 1.5 1.5 1.5h1c.83 0 1-1 1.5-1.5s1-1.5 1.5-1.5 1 .67 1.5 1.5S18 22 18.5 22s1.5-.67 1.5-1.5V10c0-4.42-3.58-8-8-8zm-3 10.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm6 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
          </svg>
        </div>
      ) : result.avatar_url ? (
        <img
          src={result.avatar_url}
          alt={result.rider_name}
          className="h-9 w-9 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-600" />
      )}

      {/* Name + time */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">
            {result.rider_name}
          </p>
          {isCurrentUser && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/60">
              Toi
            </span>
          )}
          {result.is_ghost && (
            <span className="rounded-full bg-neutral-700/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-500">
              Fantome
            </span>
          )}
        </div>
        {result.finish_time > 0 && (
          <p className="text-xs text-neutral-500">
            {formatTime(result.finish_time)}
          </p>
        )}
      </div>

      {/* GEN score badge */}
      {result.is_ghost ? (
        <div className="flex items-center gap-1.5 rounded-full border border-neutral-600/30 bg-neutral-700/20 px-2.5 py-1">
          <span className="text-xs font-bold text-neutral-400">?</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
            GEN
          </span>
        </div>
      ) : (
        <div
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${tierBg[result.tier]}`}
        >
          <span className={`text-xs font-bold ${tierColors[result.tier]}`}>
            {result.gen_score}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
            GEN
          </span>
        </div>
      )}

      {/* Ghost claim link */}
      {result.is_ghost && result.ghost_claim_token && (
        <Link
          href={`/ghost/${result.ghost_claim_token}`}
          className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-white/20"
        >
          Reclamer
        </Link>
      )}
    </div>
  );
}
