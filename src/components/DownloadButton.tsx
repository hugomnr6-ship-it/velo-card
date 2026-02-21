"use client";

import { useState } from "react";
import {
  captureCard,
  generateQR,
  drawStoryCanvas,
  dataUrlToBlob,
  shareToInstagramStory,
  addWatermark,
} from "@/lib/share-utils";
import type { CardTier } from "@/types";

interface DownloadButtonProps {
  tier: CardTier;
  userId: string;
  isPro?: boolean;
}

export default function DownloadButton({ tier, userId, isPro = false }: DownloadButtonProps) {
  const [storyBlob, setStoryBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    // Step 2: story is ready → share immediately (fresh user gesture)
    if (storyBlob) {
      try {
        await shareToInstagramStory(storyBlob);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        alert("Erreur partage: " + (err instanceof Error ? err.message : String(err)));
      }
      setStoryBlob(null);
      return;
    }

    // Step 1: generate the story image
    setLoading(true);
    try {
      const [cardData, qrData] = await Promise.all([
        captureCard(),
        generateQR(userId, tier),
      ]);
      let storyData = await drawStoryCanvas(cardData, tier, qrData);
      if (!isPro) storyData = await addWatermark(storyData);
      setStoryBlob(dataUrlToBlob(storyData));
    } catch (err) {
      console.error("Export error:", err);
      alert("Erreur export: " + (err instanceof Error ? err.message : String(err)));
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
    >
      {loading
        ? "Préparation..."
        : storyBlob
          ? "📲 Poster en Story"
          : "Partager pour Instagram"}
    </button>
  );
}
