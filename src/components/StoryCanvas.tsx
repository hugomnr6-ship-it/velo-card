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
      {/* Mesh gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            `radial-gradient(ellipse 80% 60% at 25% 20%, ${accent}18 0%, transparent 70%)`,
            `radial-gradient(ellipse 60% 50% at 75% 70%, ${accent}10 0%, transparent 65%)`,
            `radial-gradient(ellipse 90% 70% at 50% 42%, ${accent}14 0%, transparent 60%)`,
            `radial-gradient(circle at 80% 15%, ${accent}0C 0%, transparent 40%)`,
            `radial-gradient(circle at 20% 80%, ${accent}0A 0%, transparent 45%)`,
          ].join(", "),
        }}
      />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating particles (static for capture) */}
      {config.hasParticles &&
        Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${1.5 + Math.random() * 4}px`,
              height: `${1.5 + Math.random() * 4}px`,
              background: accent,
              opacity: 0.15 + Math.random() * 0.45,
              filter: Math.random() > 0.7 ? `blur(${1 + Math.random() * 2}px)` : "none",
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

      {/* Card centered — glassmorphism container */}
      <div className="absolute left-1/2 top-[200px] -translate-x-1/2">
        {/* Outer glow */}
        <div
          className="absolute -inset-[60px] rounded-[40px]"
          style={{
            background: `radial-gradient(ellipse at center, ${accent}20 0%, ${accent}08 40%, transparent 70%)`,
            filter: "blur(30px)",
          }}
        />
        {/* Glass panel behind card */}
        <div
          className="absolute -inset-[30px] rounded-[28px]"
          style={{
            background: `linear-gradient(135deg, ${accent}08, rgba(255,255,255,0.02), ${accent}05)`,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${accent}15`,
          }}
        />
        {/* Card with deep drop-shadow */}
        <div
          className="relative"
          style={{
            filter: `drop-shadow(0 20px 40px ${accent}30) drop-shadow(0 8px 16px rgba(0,0,0,0.5))`,
          }}
        >
          <VeloCard
            username={username}
            avatarUrl={avatarUrl}
            stats={stats}
            tier={tier}
          />
        </div>
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
