"use client";

import { captureCard, generateQR, drawStoryCanvas, shareToInstagramStory } from "@/lib/share-utils";
import type { CardTier } from "@/types";

interface DownloadButtonProps {
  tier: CardTier;
  userId: string;
}

export default function DownloadButton({ tier, userId }: DownloadButtonProps) {
  async function handleDownload() {
    try {
      const [cardData, qrData] = await Promise.all([
        captureCard(),
        generateQR(userId, tier),
      ]);
      const storyData = await drawStoryCanvas(cardData, tier, qrData);
      await shareToInstagramStory(storyData);
    } catch (err) {
      console.error("Export error:", err);
      alert("Erreur export: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  return (
    <button
      onClick={handleDownload}
      className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
    >
      Partager pour Instagram
    </button>
  );
}
