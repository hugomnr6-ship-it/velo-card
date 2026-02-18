import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useDuels(filter: string, enabled = true) {
  return useQuery({
    queryKey: ["duels", filter],
    queryFn: async () => {
      const res = await fetch(`/api/duels?filter=${filter}`);
      if (!res.ok) throw new Error("Erreur duels");
      return res.json();
    },
    enabled,
  });
}

export function useCreateDuel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const res = await fetch("/api/duels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Erreur création duel");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duels"] });
    },
  });
}
