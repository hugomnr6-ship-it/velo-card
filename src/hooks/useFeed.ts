import { useQuery } from "@tanstack/react-query";

export function useFeed() {
  return useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const res = await fetch("/api/feed");
      if (!res.ok) throw new Error("Erreur feed");
      return res.json();
    },
  });
}
