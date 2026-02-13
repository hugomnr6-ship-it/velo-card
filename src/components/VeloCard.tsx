"use client";

import { useState, useEffect } from "react";
import type { ComputedStats, CardTier, Badge, ClubInfo } from "@/types";

interface VeloCardProps {
  username: string;
  avatarUrl: string | null;
  stats: ComputedStats;
  tier: CardTier;
  badges?: Badge[];
  clubs?: ClubInfo[];
}

/* ——— Tier-specific config (Premium palettes) ——— */
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
    bg: "from-[#1a1108] via-[#2a1a0d] to-[#3d2b1f]",
    accent: "text-[#cd7f32]",
    accentLight: "text-[#daa06d]",
    glowClass: "card-glow-bronze",
    avatarGlow: "avatar-glow-bronze",
    shimmerGradient:
      "linear-gradient(110deg, transparent 30%, rgba(205,127,50,0.18) 50%, transparent 70%)",
    label: "BRONZE",
  },
  silver: {
    bg: "from-[#10141d] via-[#1a2030] to-[#2c3e50]",
    accent: "text-[#bdc3c7]",
    accentLight: "text-[#e2e8f0]",
    glowClass: "card-glow-silver",
    avatarGlow: "avatar-glow-silver",
    shimmerGradient:
      "linear-gradient(110deg, transparent 30%, rgba(189,195,199,0.15) 50%, transparent 70%)",
    label: "SILVER",
  },
  gold: {
    bg: "from-[#1c1804] via-[#2e2508] to-[#3a2e08]",
    accent: "text-[#ffd700]",
    accentLight: "text-[#ffe44d]",
    glowClass: "card-glow-gold",
    avatarGlow: "avatar-glow-gold",
    shimmerGradient:
      "linear-gradient(110deg, transparent 30%, rgba(255,215,0,0.22) 50%, transparent 70%)",
    label: "GOLD",
  },
};

const tierBorderColors: Record<CardTier, string> = {
  bronze: "border-[#cd7f32]/40",
  silver: "border-[#bdc3c7]/30",
  gold: "border-[#ffd700]/40",
};

const tierDividerColors: Record<CardTier, string> = {
  bronze: "from-transparent via-[#cd7f32]/50 to-transparent",
  silver: "from-transparent via-[#bdc3c7]/40 to-transparent",
  gold: "from-transparent via-[#ffd700]/60 to-transparent",
};

const tierAvatarRing: Record<CardTier, string> = {
  bronze: "border-[#cd7f32]",
  silver: "border-[#bdc3c7]",
  gold: "border-[#ffd700]",
};

const tierBadgeStyles: Record<CardTier, string> = {
  bronze: "border-[#cd7f32]/40 bg-[#cd7f32]/10",
  silver: "border-[#bdc3c7]/40 bg-[#bdc3c7]/10",
  gold: "border-[#ffd700]/40 bg-[#ffd700]/10",
};

/* ——— Spotlight gradients (radial halo behind avatar) ——— */
const spotlightGradients: Record<CardTier, string> = {
  bronze:
    "radial-gradient(circle at 50% 35%, rgba(205,127,50,0.15) 0%, transparent 50%)",
  silver:
    "radial-gradient(circle at 50% 35%, rgba(189,195,199,0.12) 0%, transparent 50%)",
  gold:
    "radial-gradient(circle at 50% 35%, rgba(255,215,0,0.22) 0%, transparent 50%)",
};

export default function VeloCard({
  username,
  avatarUrl,
  stats,
  tier,
  badges = [],
  clubs = [],
}: VeloCardProps) {
  const config = tierConfig[tier];

  // Rotating club logo index (cycles every 3s if multiple clubs)
  const [clubIndex, setClubIndex] = useState(0);

  useEffect(() => {
    if (clubs.length <= 1) return;
    const interval = setInterval(() => {
      setClubIndex((prev) => (prev + 1) % clubs.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [clubs.length]);

  const currentClub = clubs.length > 0 ? clubs[clubIndex] : null;

  return (
    <div
      id="velo-card"
      className={`relative w-[400px] h-[711px] rounded-2xl border bg-gradient-to-b overflow-hidden ${config.bg} ${tierBorderColors[tier]} ${config.glowClass}`}
    >
      {/* Tier texture overlay (z-5) */}
      <div
        className={`pointer-events-none absolute inset-0 z-[5] rounded-2xl texture-${tier}`}
      />

      {/* Scan-lines overlay (z-10) */}
      <div className="scan-lines pointer-events-none absolute inset-0 z-10 rounded-2xl" />

      {/* Spotlight halo behind avatar (z-15) */}
      <div
        className="pointer-events-none absolute inset-0 z-[15]"
        style={{ background: spotlightGradients[tier] }}
      />

      {/* Content (z-20) */}
      <div className="relative z-20 flex h-full flex-col items-center px-6 pt-6 pb-5">
        {/* ——— Top bar: branding + centered club logo + tier ——— */}
        <div className="relative flex w-full items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.3em] text-white/40">
            VELOCARD
          </span>

          {/* Club logo — centered absolutely */}
          {currentClub && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <img
                src={`/api/img?url=${encodeURIComponent(currentClub.logo_url)}`}
                alt={currentClub.name}
                crossOrigin="anonymous"
                className="h-7 w-7 rounded-full border border-white/20 object-cover transition-opacity duration-500"
                title={currentClub.name}
                key={currentClub.logo_url}
              />
            </div>
          )}

          <span
            className={`shimmer rounded-full px-3 py-0.5 text-[10px] font-bold tracking-[0.2em] ${config.accent}`}
            style={{ backgroundImage: config.shimmerGradient }}
          >
            {config.label}
          </span>
        </div>

        {/* ——— Avatar with rim light ——— */}
        <div className="mt-8 flex flex-col items-center">
          <div
            className={`relative rounded-full border-[3px] p-1 ${tierAvatarRing[tier]} ${config.avatarGlow}`}
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
            {/* Rim light overlay — white arc on top for 3D effect */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.20) 0%, transparent 40%)",
              }}
            />
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

          {/* ——— PlayStyle Badges (Glossy) ——— */}
          {badges.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`relative overflow-hidden flex items-center gap-1 rounded-full border px-2.5 py-0.5 ${tierBadgeStyles[tier]}`}
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
                  title={badge.name}
                >
                  {/* Glossy shine overlay */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%)",
                    }}
                  />
                  <span className="text-xs">{badge.emoji}</span>
                  <span className="relative text-[9px] font-bold tracking-wide text-white/80">
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

        {/* ——— Stats row 1: PAC / END / GRIM ——— */}
        <div className="mt-8 flex w-full justify-center gap-5">
          {(
            [
              { label: "PAC", value: stats.pac },
              { label: "END", value: stats.end },
              { label: "GRIM", value: stats.grim },
            ] as const
          ).map((s) => (
            <StatHex
              key={s.label}
              label={s.label}
              value={s.value}
              tier={tier}
            />
          ))}
        </div>

        {/* ——— Stats row 2: PUI / EXP / TEC ——— */}
        <div className="mt-5 flex w-full justify-center gap-5">
          {(
            [
              { label: "PUI", value: stats.pui },
              { label: "EXP", value: stats.exp },
              { label: "TEC", value: stats.tec },
            ] as const
          ).map((s) => (
            <StatHex
              key={s.label}
              label={s.label}
              value={s.value}
              tier={tier}
            />
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

/* ——— Hexagonal stat badge (Glassmorphism + Elite glow) ——— */
function StatHex({
  label,
  value,
  tier,
}: {
  label: string;
  value: number;
  tier: CardTier;
}) {
  const isElite = value >= 90;

  const valueColors: Record<CardTier, string> = {
    bronze: "text-[#daa06d]",
    silver: "text-[#e2e8f0]",
    gold: "text-[#ffe44d]",
  };

  return (
    <div className="flex h-[100px] w-[90px] flex-col items-center justify-center">
      <div
        className={`stat-badge flex h-[80px] w-[75px] flex-col items-center justify-center ${isElite ? "stat-elite" : ""}`}
        style={{
          background: "rgba(255,255,255,0.04)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.20)",
        }}
      >
        <span
          className={`text-2xl font-black ${isElite ? "text-yellow-200" : valueColors[tier]}`}
        >
          {value}
        </span>
        <span className="mt-0.5 text-[9px] font-bold tracking-[0.15em] text-white/50">
          {label}
        </span>
      </div>
    </div>
  );
}
