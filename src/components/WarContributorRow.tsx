"use client";

interface WarContributorRowProps {
  rank: number;
  username: string;
  avatarUrl: string | null;
  km: number;
  dplus: number;
  sprints: number;
}

const RANK_EMOJIS = ["🥇", "🥈", "🥉"];

export default function WarContributorRow({
  rank,
  username,
  avatarUrl,
  km,
  dplus,
  sprints,
}: WarContributorRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-800/50 bg-neutral-900/40 px-3 py-2.5">
      {/* Rank */}
      <span className="w-6 text-center text-sm">
        {rank <= 3 ? RANK_EMOJIS[rank - 1] : (
          <span className="text-xs text-neutral-600">{rank}</span>
        )}
      </span>

      {/* Avatar */}
      <div className="h-8 w-8 overflow-hidden rounded-full bg-neutral-800">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">
            {username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name */}
      <span className="flex-1 truncate text-sm font-medium text-neutral-200">
        {username}
      </span>

      {/* Stats */}
      <div className="flex items-center gap-3 text-[11px] text-neutral-500">
        <span title="Kilomètres">
          <span className="text-neutral-300">{km.toFixed(1)}</span> km
        </span>
        <span title="Dénivelé">
          <span className="text-neutral-300">{Math.round(dplus)}</span> m D+
        </span>
        <span title="Sprints">
          <span className="text-neutral-300">{sprints}</span> ⚡
        </span>
      </div>
    </div>
  );
}
