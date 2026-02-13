"use client";

import type { ComputedStats, CardTier, Badge } from "@/types";

interface VeloCardProps {
  username: string;
  avatarUrl: string | null;
  stats: ComputedStats;
  tier: CardTier;
  badges?: Badge[];
}

/* ——— Tier-specific config ——— */
const tierConfig: Record<
  CardTier,
  {
    bg: string;
    accent: string;
    accentLight: string;
    glowClass: string;
    avatarGlow: string;
    shimmerGradient: string;
    label: string;
  }
> = {
  bronze: {
    bg: "from-[#1a1108] via-[#211609] to-[#2a1d0e]",
    accent: "text-amber-500",
    accentLight: "text-amber-400",
    glowClass: "card-glow-bronze",
    avatarGlow: "avatar-glow-bronze",
    shimmerGradient:
      "linear-gradient(110deg, transparent 30%, rgba(217,119,6,0.15) 50%, transparent 70%)",
    label: "BRONZE",
  },
  silver: {
    bg: "from-[#0e1117] via-[#131820] to-[#1a1d23]",
    accent: "text-slate-300",
    accentLight: "text-slate-200",
    glowClass: "card-glow-silver",
    avatarGlow: "avatar-glow-silver",
    shimmerGradient:
      "linear-gradient(110deg, transparent 30%, rgba(148,163,184,0.15) 50%, transparent 70%)",
    label: "SILVER",
  },
  gold: {
    bg: "from-[#1a1508] via-[#221c0a] to-[#2a2210]",
    accent: "text-yellow-400",
    accentLight: "text-yellow-300",
    glowClass: "card-glow-gold",
    avatarGlow: "avatar-glow-gold",
    shimmerGradient:
      "linear-gradient(110deg, transparent 30%, rgba(250,204,21,0.2) 50%, transparent 70%)",
    label: "GOLD",
  },
};

const tierBorderColors: Record<CardTier, string> = {
  bronze: "border-amber-800/50",
  silver: "border-slate-600/50",
  gold: "border-yellow-700/50",
};

const tierDividerColors: Record<CardTier, string> = {
  bronze: "from-transparent via-amber-600/50 to-transparent",
  silver: "from-transparent via-slate-400/50 to-transparent",
  gold: "from-transparent via-yellow-500/60 to-transparent",
};

const tierAvatarRing: Record<CardTier, string> = {
  bronze: "border-amber-600",
  silver: "border-slate-400",
  gold: "border-yellow-500",
};

const tierBadgeStyles: Record<CardTier, string> = {
  bronze: "border-amber-600/40 bg-amber-900/20",
  silver: "border-slate-400/40 bg-slate-700/20",
  gold: "border-yellow-500/40 bg-yellow-900/20",
};

const lockedStats = ["PUI", "EXP", "TEC"] as const;

export default function VeloCard({
  username,
  avatarUrl,
  stats,
  tier,
  badges = [],
}: VeloCardProps) {
  const config = tierConfig[tier];

  return (
    <div
      id="velo-card"
      className={`relative w-[400px] h-[711px] rounded-2xl border bg-gradient-to-b overflow-hidden ${config.bg} ${tierBorderColors[tier]} ${config.glowClass}`}
    >
      {/* Scan-lines overlay */}
      <div className="scan-lines pointer-events-none absolute inset-0 z-10 rounded-2xl" />

      {/* Content */}
      <div className="relative z-20 flex h-full flex-col items-center px-6 pt-6 pb-5">
        {/* ——— Top bar: branding + tier ——— */}
        <div className="flex w-full items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.3em] text-white/40">
            VELOCARD
          </span>
          <span
            className={`shimmer rounded-full px-3 py-0.5 text-[10px] font-bold tracking-[0.2em] ${config.accent}`}
            style={{ backgroundImage: config.shimmerGradient }}
          >
            {config.label}
          </span>
        </div>

        {/* ——— Avatar ——— */}
        <div className="mt-8 flex flex-col items-center">
          <div
            className={`rounded-full border-[3px] p-1 ${tierAvatarRing[tier]} ${config.avatarGlow}`}
          >
            {avatarUrl ? (
              <img
                src={`/api/img?url=${encodeURIComponent(avatarUrl)}`}
                alt={username}
                crossOrigin="anonymous"
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-white/10" />
            )}
          </div>

          {/* Username + tier */}
          <p className="mt-4 text-xl font-bold tracking-wide text-white">
            {username}
          </p>
          <p
            className={`mt-1 text-[10px] font-semibold tracking-[0.25em] ${config.accent} opacity-70`}
          >
            {config.label} TIER
          </p>

          {/* ——— PlayStyle Badges ——— */}
          {badges.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 ${tierBadgeStyles[tier]}`}
                  title={badge.name}
                >
                  <span className="text-xs">{badge.emoji}</span>
                  <span className="text-[9px] font-bold tracking-wide text-white/80">
                    {badge.name.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ——— Divider ——— */}
        <div
          className={`mt-6 h-px w-full bg-gradient-to-r ${tierDividerColors[tier]}`}
        />

        {/* ——— Active stats ——— */}
        <div className="mt-8 flex w-full justify-center gap-5">
          {([
            { label: "PAC", value: stats.pac },
            { label: "END", value: stats.end },
            { label: "GRIM", value: stats.grim },
          ] as const).map((s) => (
            <StatHex key={s.label} label={s.label} value={s.value} tier={tier} />
          ))}
        </div>

        {/* ——— Locked stats ——— */}
        <div className="mt-5 flex w-full justify-center gap-5">
          {lockedStats.map((label) => (
            <div
              key={label}
              className="flex h-[100px] w-[90px] flex-col items-center justify-center opacity-30"
            >
              <div className="stat-badge flex h-[80px] w-[75px] flex-col items-center justify-center bg-white/5">
                <span className="text-lg text-white/30">&#128274;</span>
                <span className="mt-0.5 text-[9px] font-bold tracking-[0.15em] text-white/30">
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ——— Spacer ——— */}
        <div className="flex-1" />

        {/* ——— Bottom divider + branding ——— */}
        <div
          className={`h-px w-3/4 bg-gradient-to-r ${tierDividerColors[tier]} opacity-50`}
        />
        <p className="mt-3 text-[9px] tracking-[0.2em] text-white/20">
          VELOCARD.APP
        </p>
      </div>
    </div>
  );
}

/* ——— Hexagonal stat badge ——— */
function StatHex({
  label,
  value,
  tier,
}: {
  label: string;
  value: number;
  tier: CardTier;
}) {
  const bgColors: Record<CardTier, string> = {
    bronze: "bg-amber-900/30",
    silver: "bg-slate-700/30",
    gold: "bg-yellow-900/30",
  };

  const valueColors: Record<CardTier, string> = {
    bronze: "text-amber-400",
    silver: "text-slate-200",
    gold: "text-yellow-300",
  };

  return (
    <div className="flex h-[100px] w-[90px] flex-col items-center justify-center">
      <div
        className={`stat-badge flex h-[80px] w-[75px] flex-col items-center justify-center ${bgColors[tier]}`}
      >
        <span className={`text-2xl font-black ${valueColors[tier]}`}>
          {value}
        </span>
        <span className="mt-0.5 text-[9px] font-bold tracking-[0.15em] text-white/50">
          {label}
        </span>
      </div>
    </div>
  );
}
