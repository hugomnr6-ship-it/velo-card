import { useQuery } from "@tanstack/react-query";
import type { ComputedStats, CardTier } from "@/types";

export interface CardPreviewData {
  username: string;
  avatarUrl: string | null;
  stats: ComputedStats;
  tier: CardTier;
  country: string | null;
  countryCode: string | null;
  betaNumber: number | null;
}

/**
 * Fetches the current user's card data for skin preview rendering.
 * Used by the shop page to show real card previews.
 */
export function useCardPreview() {
  return useQuery<CardPreviewData>({
    queryKey: ["card-preview"],
    queryFn: async () => {
      const res = await fetch("/api/me/card-data");
      if (!res.ok) throw new Error("Erreur chargement carte");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 min — stats don't change often
  });
}
