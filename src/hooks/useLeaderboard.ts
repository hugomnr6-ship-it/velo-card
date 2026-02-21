import { useQuery } from "@tanstack/react-query";
import type { LeaderboardEntry } from "@/types";

export function useLeaderboard(region: string | null, sort: string) {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard", region, sort],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?region=${encodeURIComponent(region!)}&sort=${sort}`);
      if (!res.ok) throw new Error("Erreur leaderboard");
      const data = await res.json();
      // L'API retourne { entries, isPro, totalEntries } — on extrait le tableau
      return Array.isArray(data) ? data : (data.entries ?? []);
    },
    enabled: !!region,
    staleTime: 5 * 60 * 1000, // 5 min — weekly leaderboard
  });
}
