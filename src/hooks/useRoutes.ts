import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface SavedRoute {
  id: string;
  user_id: string;
  name: string;
  gpx_url: string | null;
  distance_km: number;
  elevation_gain: number;
  rdi_score: number | null;
  climb_count: number;
  center_lat: number | null;
  center_lng: number | null;
  created_at: string;
}

interface CreateRouteInput {
  name: string;
  gpx_url?: string | null;
  distance_km: number;
  elevation_gain: number;
  rdi_score?: number | null;
  climb_count?: number;
  center_lat?: number | null;
  center_lng?: number | null;
}

/**
 * Hook pour gérer les parcours sauvegardés avec CRUD et optimistic updates.
 */
export function useRoutes() {
  const queryClient = useQueryClient();
  const queryKey = ["saved-routes"];

  const { data: routes = [], ...query } = useQuery<SavedRoute[]>({
    queryKey,
    queryFn: async () => {
      const res = await fetch("/api/routes");
      if (!res.ok) throw new Error("Erreur chargement parcours");
      return res.json();
    },
  });

  const createRoute = useMutation({
    mutationFn: async (input: CreateRouteInput) => {
      const res = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || "Erreur sauvegarde parcours");
      }
      return res.json() as Promise<SavedRoute>;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteRoute = useMutation({
    mutationFn: async (routeId: string) => {
      const res = await fetch(`/api/routes/${routeId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur suppression parcours");
      return res.json();
    },
    // Optimistic update pour le delete
    onMutate: async (routeId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SavedRoute[]>(queryKey);
      queryClient.setQueryData<SavedRoute[]>(queryKey, (old) =>
        (old || []).filter((r) => r.id !== routeId),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    routes,
    ...query,
    createRoute,
    deleteRoute,
  };
}
