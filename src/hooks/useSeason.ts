import { useQuery } from "@tanstack/react-query";

export interface SeasonInfo {
  season: {
    id: string;
    name: string;
    status: string;
    start_date: string;
    end_date: string;
  } | null;
  rankings: {
    user_id: string;
    season_points: number;
    total_km: number;
    total_dplus: number;
    duels_won: number;
    quests_completed: number;
    wars_won: number;
    rank: number;
    profiles: { username: string; avatar_url: string | null };
  }[];
}

export interface MySeasonStats {
  season_points: number;
  total_km: number;
  total_dplus: number;
  duels_won: number;
  quests_completed: number;
  wars_won: number;
  rank: number | null;
  total_participants: number;
}

export function useSeason() {
  return useQuery<SeasonInfo>({
    queryKey: ["season"],
    queryFn: async () => {
      const res = await fetch("/api/seasons");
      if (!res.ok) throw new Error("Erreur saison");
      return res.json();
    },
  });
}

export function useMySeasonStats() {
  return useQuery<MySeasonStats>({
    queryKey: ["season-me"],
    queryFn: async () => {
      const res = await fetch("/api/seasons/me");
      if (!res.ok) throw new Error("Erreur stats saison");
      return res.json();
    },
  });
}
