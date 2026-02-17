import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface UserBadge {
  badge_id: string;
  earned_at: string;
}

export function useUserBadges() {
  return useQuery<UserBadge[]>({
    queryKey: ["badges"],
    queryFn: async () => {
      const res = await fetch("/api/badges");
      if (!res.ok) throw new Error("Erreur badges");
      return res.json();
    },
  });
}

export function useShowcaseBadges() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (badgeIds: string[]) => {
      const res = await fetch("/api/badges/showcase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeIds }),
      });
      if (!res.ok) throw new Error("Erreur showcase");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
    },
  });
}
