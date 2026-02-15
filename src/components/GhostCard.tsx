"use client";

import type { CardTier } from "@/types";
import {
  tierConfig,
  tierBorderColors,
  tierDividerColors,
  spotlightGradients,
  tierPillBg,
  tierPillBorder,
  StatHex,
} from "@/components/VeloCard";

interface GhostCardProps {
  riderName: string;
  genScore: number;
  tier: CardTier;
  raceName?: string;
  position?: number;
}

export default function GhostCard({
  riderName,
  genScore,
  tier,
}: GhostCardProps) {
  const config = tierConfig[tier];

  return (
    <div className="ghost-card-filter">
      <div
        className={`relative w-[400px] h-[711px] rounded-2xl border-[1.5px] bg-gradient-to-b overflow-hidden ${config.bg} ${tierBorderColors[tier]} ${config.glowClass}`}
      >
        {/* Tier texture overlay */}
        <div
          className={`pointer-events-none absolute inset-0 z-[5] rounded-2xl texture-${tier}`}
        />

        {/* Scan-lines overlay */}
        <div className="scan-lines pointer-events-none absolute inset-0 z-10 rounded-2xl" />

        {/* Spotlight */}
        <div
          className="pointer-events-none absolute inset-0 z-[15]"
          style={{ background: spotlightGradients[tier] }}
        />

        {/* Ghost overlay icon — large semi-transparent */}
        <div className="pointer-events-none absolute inset-0 z-[18] flex items-center justify-center opacity-[0.06]">
          <svg width="200" height="200" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C7.58 2 4 5.58 4 10v10.5c0 .83 1 1.5 1.5 1.5s1-.67 1.5-1.5 1-1.5 1.5-1.5 1 .67 1.5 1.5.67 1.5 1.5 1.5h1c.83 0 1-1 1.5-1.5s1-1.5 1.5-1.5 1 .67 1.5 1.5S18 22 18.5 22s1.5-.67 1.5-1.5V10c0-4.42-3.58-8-8-8zm-3 10.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm6 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-20 flex h-full flex-col items-center px-6 pt-6 pb-5">
          {/* Top bar */}
          <div className="relative flex w-full items-center justify-between">
            <span className="text-[11px] font-bold tracking-[0.3em] text-white/40">
              VELOCARD
            </span>

            {/* Ghost pill */}
            <span
              className={`shimmer rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.2em] ${config.accent}`}
              style={{
                backgroundImage: config.shimmerGradient,
                backgroundColor: tierPillBg[tier],
                border: `1px solid ${tierPillBorder[tier]}`,
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              FANTOME
            </span>
          </div>

          {/* Avatar — black silhouette cyclist */}
          <div className="mt-8 flex flex-col items-center">
            <div className="rounded-full bg-white/5 p-[3px]" style={{ boxShadow: "0 0 24px rgba(255,255,255,0.1)" }}>
              <div className="relative rounded-full border-[3px] border-white/10 p-[2px]">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/60">
                  {/* Cyclist silhouette SVG */}
                  <svg
                    width="44"
                    height="44"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-30"
                  >
                    <circle cx="5" cy="18" r="3" />
                    <circle cx="19" cy="18" r="3" />
                    <path d="M12 18V9l-3 5h7l-2-5" />
                    <circle cx="17" cy="5" r="1" />
                    <path d="M12 9l2-4" />
                  </svg>
                </div>
                {/* Rim light */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 40%)",
                  }}
                />
              </div>
            </div>

            {/* Rider name */}
            <p className="mt-4 text-xl font-bold tracking-wide text-white">
              {riderName}
            </p>
            <p
              className={`mt-1 text-[10px] font-semibold tracking-[0.25em] ${config.accent} opacity-70`}
            >
              FANTOME
            </p>
          </div>

          {/* Divider */}
          <div
            className={`mt-6 h-px w-full bg-gradient-to-r ${tierDividerColors[tier]}`}
          />

          {/* Single GEN stat — centered */}
          <div className="mt-12 flex w-full justify-center">
            <StatHex label="GEN" value={genScore} tier={tier} />
          </div>

          {/* Ghost message */}
          <p className="mt-6 text-center text-xs text-white/30 leading-relaxed">
            Ce coureur n&apos;a pas encore reclame<br />
            sa carte VeloCard
          </p>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom divider + branding */}
          <div
            className={`h-px w-3/4 bg-gradient-to-r ${tierDividerColors[tier]} opacity-50`}
          />
          <p className="mt-3 text-[9px] tracking-[0.2em] text-white/20">
            VELOCARD.APP
          </p>
        </div>
      </div>
    </div>
  );
}
