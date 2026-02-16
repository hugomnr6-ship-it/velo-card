import { useQuery } from "@tanstack/react-query";
import type { LeaderboardEntry } from "@/types";

export function useLeaderboard(region: string | null, sort: string) {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard", region, sort],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?region=${encodeURIComponent(region!)}&sort=${sort}`);
      if (!res.ok) throw new Error("Erreur leaderboard");
      return res.json();
    },
    enabled: !!region,
  });
}
