import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Favorite {
  id: string;
  user_id: string;
  entity_type: "race" | "route" | "profile";
  entity_id: string;
  created_at: string;
}

/**
 * Hook pour gérer les favoris avec optimistic updates.
 */
export function useFavorites(entityType?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["favorites", entityType || "all"];

  const { data: favorites = [], ...query } = useQuery<Favorite[]>({
    queryKey,
    queryFn: async () => {
      const params = entityType ? `?entity_type=${entityType}` : "";
      const res = await fetch(`/api/favorites${params}`);
      if (!res.ok) throw new Error("Erreur chargement favoris");
      return res.json();
    },
  });

  const addFavorite = useMutation({
    mutationFn: async ({ entityType, entityId }: { entityType: string; entityId: string }) => {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity_type: entityType, entity_id: entityId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || "Erreur ajout favori");
      }
      return res.json();
    },
    // Optimistic update
    onMutate: async ({ entityType: et, entityId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Favorite[]>(queryKey);
      const optimistic: Favorite = {
        id: `temp-${Date.now()}`,
        user_id: "",
        entity_type: et as Favorite["entity_type"],
        entity_id: entityId,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<Favorite[]>(queryKey, (old) => [optimistic, ...(old || [])]);
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

  const removeFavorite = useMutation({
    mutationFn: async (favoriteId: string) => {
      const res = await fetch(`/api/favorites/${favoriteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur suppression favori");
      return res.json();
    },
    // Optimistic update
    onMutate: async (favoriteId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Favorite[]>(queryKey);
      queryClient.setQueryData<Favorite[]>(queryKey, (old) =>
        (old || []).filter((f) => f.id !== favoriteId),
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
    favorites,
    ...query,
    addFavorite,
    removeFavorite,
    isFavorited: (entityId: string) => favorites.some((f) => f.entity_id === entityId),
    getFavoriteId: (entityId: string) => favorites.find((f) => f.entity_id === entityId)?.id,
  };
}
