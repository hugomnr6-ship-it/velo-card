"use client";

import VeloCard from "@/components/VeloCard";
import type { CardSkinId } from "@/components/VeloCard";
import type { CardPreviewData } from "@/hooks/useCardPreview";

interface SkinPreviewCardProps {
  cardData: CardPreviewData;
  skinId: string;
  /** "sm" for grid items, "lg" for featured/modal */
  size: "sm" | "lg";
}

const sizeConfig = {
  sm: { scale: 0.38, width: 107, height: 179 },
  lg: { scale: 0.58, width: 163, height: 273 },
};

/**
 * Renders a VeloCard at a scaled-down size with the given skin applied.
 * Used in the shop page to preview skins on the user's actual card.
 */
export default function SkinPreviewCard({
  cardData,
  skinId,
  size,
}: SkinPreviewCardProps) {
  const cfg = sizeConfig[size];

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{
        width: cfg.width,
        height: cfg.height,
      }}
    >
      <div
        style={{
          transform: `scale(${cfg.scale})`,
          transformOrigin: "top left",
          width: 280,
          height: 470,
          pointerEvents: "none",
        }}
      >
        <VeloCard
          username={cardData.username}
          avatarUrl={cardData.avatarUrl}
          stats={cardData.stats}
          tier={cardData.tier}
          country={cardData.country || undefined}
          countryCode={cardData.countryCode || undefined}
          skin={skinId as CardSkinId}
          betaNumber={cardData.betaNumber}
        />
      </div>
    </div>
  );
}
