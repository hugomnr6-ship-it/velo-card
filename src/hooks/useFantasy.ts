import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FantasyLeague, FantasyParticipant, FantasyTeamMember, FantasyWeeklyScore } from "@/types";

// ——— Types enrichis pour les réponses API ———

interface FantasyLeagueEnriched extends FantasyLeague {
  creator: { id: string; username: string; avatar_url: string | null };
  participant_count: number;
}

interface FantasyListResponse {
  myLeagues: FantasyLeagueEnriched[];
  publicLeagues: FantasyLeagueEnriched[];
}

interface AvailableCyclist {
  id: string;
  username: string;
  avatar_url: string | null;
  ovr: number;
  tier: string;
  pac: number;
  mon: number;
  val: number;
  spr: number;
  end: number;
  res: number;
  cost: number;
}

interface FantasyParticipantEnriched extends FantasyParticipant {
  user: { id: string; username: string; avatar_url: string | null };
  team: (FantasyTeamMember & {
    cyclist: {
      id: string;
      username: string;
      avatar_url: string | null;
      ovr: number;
      tier: string;
    };
  })[];
}

interface FantasyLeagueDetails {
  league: FantasyLeagueEnriched;
  participants: FantasyParticipantEnriched[];
  weeklyScores: FantasyWeeklyScore[];
  isParticipant: boolean;
  myParticipantId: string | null;
}

// ——— Queries ———

export function useMyLeagues() {
  return useQuery<FantasyListResponse>({
    queryKey: ["fantasy"],
    queryFn: async () => {
      const res = await fetch("/api/fantasy");
      if (!res.ok) throw new Error("Erreur ligues fantasy");
      return res.json();
    },
  });
}

export function useFantasyLeague(leagueId: string | null) {
  return useQuery<FantasyLeagueDetails>({
    queryKey: ["fantasy", leagueId],
    queryFn: async () => {
      const res = await fetch(`/api/fantasy/${leagueId}`);
      if (!res.ok) throw new Error("Erreur ligue fantasy");
      return res.json();
    },
    enabled: !!leagueId,
  });
}

export function useAvailableCyclists(leagueId: string | null) {
  return useQuery<AvailableCyclist[]>({
    queryKey: ["fantasy", leagueId, "available"],
    queryFn: async () => {
      const res = await fetch(`/api/fantasy/${leagueId}/available`);
      if (!res.ok) throw new Error("Erreur cyclistes disponibles");
      return res.json();
    },
    enabled: !!leagueId,
  });
}

// ——— Mutations ———

export function useCreateLeague() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      isPublic: boolean;
      entryFee: number;
      maxParticipants: number;
      durationWeeks: string;
    }) => {
      const res = await fetch("/api/fantasy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur création");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fantasy"] });
    },
  });
}

export function useJoinLeague() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leagueId, inviteCode }: { leagueId: string; inviteCode?: string }) => {
      const res = await fetch(`/api/fantasy/${leagueId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur inscription");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fantasy"] });
      queryClient.invalidateQueries({ queryKey: ["coins"] });
    },
  });
}

export function useStartLeague() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leagueId: string) => {
      const res = await fetch(`/api/fantasy/${leagueId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lancement");
      }
      return res.json();
    },
    onSuccess: (_, leagueId) => {
      queryClient.invalidateQueries({ queryKey: ["fantasy"] });
      queryClient.invalidateQueries({ queryKey: ["fantasy", leagueId] });
    },
  });
}

export function useDraftCyclist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leagueId,
      cyclistId,
      isCaptain = false,
      isSuperSub = false,
    }: {
      leagueId: string;
      cyclistId: string;
      isCaptain?: boolean;
      isSuperSub?: boolean;
    }) => {
      const res = await fetch(`/api/fantasy/${leagueId}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cyclistId, isCaptain, isSuperSub }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur draft");
      }
      return res.json();
    },
    onSuccess: (_, { leagueId }) => {
      queryClient.invalidateQueries({ queryKey: ["fantasy", leagueId] });
      queryClient.invalidateQueries({ queryKey: ["fantasy", leagueId, "available"] });
    },
  });
}

export function useRemoveCyclist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leagueId, cyclistId }: { leagueId: string; cyclistId: string }) => {
      const res = await fetch(`/api/fantasy/${leagueId}/draft/${cyclistId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur retrait");
      }
      return res.json();
    },
    onSuccess: (_, { leagueId }) => {
      queryClient.invalidateQueries({ queryKey: ["fantasy", leagueId] });
      queryClient.invalidateQueries({ queryKey: ["fantasy", leagueId, "available"] });
    },
  });
}

export function useMakeTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leagueId,
      droppedCyclistId,
      pickedCyclistId,
    }: {
      leagueId: string;
      droppedCyclistId: string;
      pickedCyclistId: string;
    }) => {
      const res = await fetch(`/api/fantasy/${leagueId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ droppedCyclistId, pickedCyclistId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur transfert");
      }
      return res.json();
    },
    onSuccess: (_, { leagueId }) => {
      queryClient.invalidateQueries({ queryKey: ["fantasy", leagueId] });
      queryClient.invalidateQueries({ queryKey: ["fantasy", leagueId, "available"] });
      queryClient.invalidateQueries({ queryKey: ["coins"] });
    },
  });
}
