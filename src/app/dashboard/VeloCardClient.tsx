"use client";

import VeloCardInteractive from "@/components/VeloCardInteractive";
import CardWidget from "@/components/CardWidget";
import DownloadButton from "@/components/DownloadButton";
import RouteAnalysisSection from "./RouteAnalysisSection";
import type { ComputedStats, CardTier, Badge, ClubInfo } from "@/types";

interface VeloCardClientProps {
  username: string;
  avatarUrl: string | null;
  stats: ComputedStats;
  tier: CardTier;
  badges: Badge[];
  clubs?: ClubInfo[];
  userId: string;
}

export default function VeloCardClient({
  username,
  avatarUrl,
  stats,
  tier,
  badges,
  clubs,
  userId,
}: VeloCardClientProps) {
  return (
    <>
      {/* Compact card widget — quick overview */}
      <CardWidget
        username={username}
        avatarUrl={avatarUrl}
        stats={stats}
        tier={tier}
        userId={userId}
      />

      {/* Full interactive card */}
      <VeloCardInteractive
        username={username}
        avatarUrl={avatarUrl}
        stats={stats}
        tier={tier}
        badges={badges}
        clubs={clubs}
      />
      <DownloadButton tier={tier} />
      <RouteAnalysisSection tier={tier} />
    </>
  );
}
