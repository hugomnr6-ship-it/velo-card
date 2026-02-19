"use client";

import Link from "next/link";
import FlipCard from "@/components/FlipCard";
import DownloadButton from "@/components/DownloadButton";
import type { ComputedStats, CardTier, Badge, ClubInfo } from "@/types";
import { tierConfig } from "@/components/VeloCard";

interface ProfileClientProps {
  username: string;
  avatarUrl: string | null;
  stats: ComputedStats;
  tier: CardTier;
  badges: Badge[];
  clubs: ClubInfo[];
  userId: string;
}

const tierAccentHex: Record<CardTier, string> = {
  bronze: "#cd7f32",
  argent: "#C0C8D4",
  platine: "#E0E8F0",
  diamant: "#B9F2FF",
  legende: "#FFD700",
};

export default function ProfileClient({
  username,
  avatarUrl,
  stats,
  tier,
  badges,
  clubs,
  userId,
}: ProfileClientProps) {
  const config = tierConfig[tier];
  const accent = tierAccentHex[tier];

  return (
    <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-8">
      {/* Tier banner */}
      <div
        className="absolute left-0 right-0 top-0 h-32"
        style={{
          background: `linear-gradient(180deg, ${accent}15 0%, transparent 100%)`,
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-lg font-bold text-white font-['Space_Grotesk'] max-w-[90vw] truncate">
          {username}
        </h1>
        <span
          className="mt-1 text-[10px] font-bold tracking-[0.2em]"
          style={{ color: accent }}
        >
          {config.label} TIER
        </span>
      </div>

      {/* Flip card */}
      <div className="relative z-10 mt-6">
        <FlipCard
          username={username}
          avatarUrl={avatarUrl}
          stats={stats}
          tier={tier}
          badges={badges}
          clubs={clubs}
        />
        <p className="mt-3 text-center text-[10px] text-white/30">
          Touche la carte pour la retourner
        </p>
      </div>

      {/* Actions */}
      <div className="relative z-10 mt-6 flex flex-col items-center gap-3">
        <div className="flex gap-3">
          <Link
            href={`/card/${userId}`}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Voir la carte
          </Link>
          <button
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/40 transition"
            disabled
            title="Bientôt disponible"
          >
            Comparer
          </button>
        </div>

        {/* Partager Story Instagram — uses DownloadButton with StoryCanvas */}
        <DownloadButton tier={tier} userId={userId} />
      </div>
    </main>
  );
}
