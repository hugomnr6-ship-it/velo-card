"use client";

import VeloCard from "@/components/VeloCard";
import DownloadButton from "@/components/DownloadButton";
import type { ComputedStats, CardTier } from "@/types";

interface VeloCardClientProps {
  username: string;
  avatarUrl: string | null;
  stats: ComputedStats;
  tier: CardTier;
}

export default function VeloCardClient({
  username,
  avatarUrl,
  stats,
  tier,
}: VeloCardClientProps) {
  return (
    <>
      <VeloCard
        username={username}
        avatarUrl={avatarUrl}
        stats={stats}
        tier={tier}
      />
      <DownloadButton tier={tier} />
    </>
  );
}
