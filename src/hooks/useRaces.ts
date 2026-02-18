import { useQuery } from "@tanstack/react-query";

export function useRaces(filters: Record<string, string>, enabled = true) {
  const params = new URLSearchParams(filters);
  return useQuery<any[]>({
    queryKey: ["races", filters],
    queryFn: async () => {
      const res = await fetch(`/api/races?${params}`);
      if (!res.ok) throw new Error("Erreur courses");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 min — races change infrequently
    enabled,
  });
}
