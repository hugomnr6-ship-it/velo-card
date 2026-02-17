import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Tournament {
  id: string;
  name: string;
  type: string;
  category: string;
  max_participants: number;
  entry_cost_coins: number;
  prize_pool_coins: number;
  status: string;
  start_date: string;
  current_participants?: number;
}

export interface TournamentDetail {
  tournament: Tournament;
  participants: {
    user_id: string;
    seed: number;
    is_eliminated: boolean;
    final_rank: number | null;
    profiles: { username: string; avatar_url: string | null };
    user_stats: { ovr: number; tier: string } | null;
  }[];
  matches: {
    id: string;
    round: number;
    match_number: number;
    player_a_id: string | null;
    player_b_id: string | null;
    winner_id: string | null;
    player_a_value: number | null;
    player_b_value: number | null;
    status: string;
    player_a?: { username: string; ovr: number };
    player_b?: { username: string; ovr: number };
  }[];
  isParticipant: boolean;
}

export function useTournaments() {
  return useQuery<Tournament[]>({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const res = await fetch("/api/tournaments");
      if (!res.ok) throw new Error("Erreur tournois");
      return res.json();
    },
  });
}

export function useTournamentDetail(id: string | null) {
  return useQuery<TournamentDetail>({
    queryKey: ["tournament", id],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/${id}`);
      if (!res.ok) throw new Error("Erreur tournoi");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useJoinTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tournamentId: string) => {
      const res = await fetch(`/api/tournaments/${tournamentId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur inscription");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["tournament"] });
      queryClient.invalidateQueries({ queryKey: ["coins"] });
    },
  });
}
