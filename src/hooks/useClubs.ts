import { useQuery } from "@tanstack/react-query";

export function useClubs(search?: string) {
  return useQuery({
    queryKey: ["clubs", search],
    queryFn: async () => {
      const url = search ? `/api/clubs?q=${encodeURIComponent(search)}` : "/api/clubs";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur clubs");
      return res.json();
    },
  });
}
