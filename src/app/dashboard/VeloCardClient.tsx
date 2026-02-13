"use client";

import VeloCardInteractive from "@/components/VeloCardInteractive";
import DownloadButton from "@/components/DownloadButton";
import type { ComputedStats, CardTier, Badge } from "@/types";

interface VeloCardClientProps {
  username: string;
  avatarUrl: string | null;
  stats: ComputedStats;
  tier: CardTier;
  badges: Badge[];
}

export default function VeloCardClient({
  username,
  avatarUrl,
  stats,
  tier,
  badges,
}: VeloCardClientProps) {
  return (
    <>
      <VeloCardInteractive
        username={username}
        avatarUrl={avatarUrl}
        stats={stats}
        tier={tier}
        badges={badges}
      />
      <DownloadButton tier={tier} />
    </>
  );
}
