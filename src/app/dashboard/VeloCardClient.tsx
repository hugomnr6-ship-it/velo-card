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
  clubName?: string | null;
  clubLogoUrl?: string | null;
}

export default function VeloCardClient({
  username,
  avatarUrl,
  stats,
  tier,
  badges,
  clubName,
  clubLogoUrl,
}: VeloCardClientProps) {
  return (
    <>
      <VeloCardInteractive
        username={username}
        avatarUrl={avatarUrl}
        stats={stats}
        tier={tier}
        badges={badges}
        clubName={clubName}
        clubLogoUrl={clubLogoUrl}
      />
      <DownloadButton tier={tier} />
    </>
  );
}
