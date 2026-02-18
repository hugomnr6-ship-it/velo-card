import { useQuery } from "@tanstack/react-query";

export function useProfile(enabled = true) {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Erreur profil");
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // 10 min — profile rarely changes
    enabled,
  });
}
