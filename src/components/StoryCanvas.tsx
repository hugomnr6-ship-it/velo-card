"use client";

import type { ComputedStats, CardTier } from "@/types";
import VeloCard from "./VeloCard";
import { tierConfig, tierBorderColors } from "./VeloCard";
import QRCode from "./QRCode";

interface StoryCanvasProps {
  username: string;
  avatarUrl: string | null;
  stats: ComputedStats;
  tier: CardTier;
  userId: string;
}

const tierAccentHex: Record<CardTier, string> = {
  bronze: "#cd7f32",
  argent: "#B8A0D8",
  platine: "#E0E8F0",
  diamant: "#B9F2FF",
  legende: "#FFD700",
};

const tierBgHex: Record<CardTier, string> = {
  bronze: "#0d0a04",
  argent: "#06080c",
  platine: "#060a0c",
  diamant: "#040a0d",
  legende: "#0d0b04",
};

export default function StoryCanvas({
  username,
  avatarUrl,
  stats,
  tier,
  userId,
}: StoryCanvasProps) {
  const cardUrl = `https://velocard.app/card/${userId}`;
  const config = tierConfig[tier];
  const accent = tierAccentHex[tier];
  const bg = tierBgHex[tier];

  return (
    <div
      id="story-canvas"
      className="relative overflow-hidden"
      style={{
        width: 1080,
        height: 1920,
        backgroundColor: bg,
      }}
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 42%, ${accent}12 0%, transparent 60%)`,
        }}
      />

      {/* Floating particles (static for capture) */}
      {config.hasParticles &&
        Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              background: accent,
              opacity: 0.3 + Math.random() * 0.4,
            }}
          />
        ))}

      {/* Top branding */}
      <div className="absolute left-0 right-0 top-[80px] text-center">
        <p
          className="text-[18px] font-bold tracking-[0.5em] opacity-30"
          style={{ color: accent }}
        >
          VELOCARD
        </p>
      </div>

      {/* Card centered */}
      <div className="absolute left-1/2 top-[200px] -translate-x-1/2">
        <VeloCard
          username={username}
          avatarUrl={avatarUrl}
          stats={stats}
          tier={tier}
        />
      </div>

      {/* Stats bar at bottom */}
      <div className="absolute bottom-[200px] left-0 right-0 flex justify-center gap-16">
        {[
          { label: "OVR", value: stats.ovr.toString() },
          { label: "VIT", value: stats.pac.toString() },
          { label: "MON", value: stats.mon.toString() },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p
              className="text-[32px] font-black font-['JetBrains_Mono']"
              style={{ color: accent }}
            >
              {s.value}
            </p>
            <p className="text-[14px] font-bold tracking-[0.2em] text-white/30">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* QR Code + CTA */}
      <div className="absolute bottom-[80px] left-0 right-0 flex flex-col items-center gap-3">
        <QRCode url={cardUrl} size={100} color={accent} asImage />
        <p className="text-[14px] font-semibold tracking-wider text-white/30">
          Scanne pour voir ma carte
        </p>
      </div>

      {/* Bottom watermark */}
      <div className="absolute bottom-[40px] left-0 right-0 text-center">
        <p className="text-[14px] font-semibold tracking-[0.4em] text-white/12">
          VELOCARD.APP
        </p>
      </div>
    </div>
  );
}
