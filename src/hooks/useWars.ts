import { useQuery } from "@tanstack/react-query";
import type { WarDashboard } from "@/types";

export function useWarDashboard() {
  return useQuery<WarDashboard>({
    queryKey: ["wars", "current"],
    queryFn: async () => {
      const res = await fetch("/api/wars/current");
      if (!res.ok) throw new Error("Erreur wars");
      return res.json();
    },
  });
}

export function useWarHistory() {
  return useQuery({
    queryKey: ["wars", "history"],
    queryFn: async () => {
      const res = await fetch("/api/wars/history");
      if (!res.ok) throw new Error("Erreur historique wars");
      return res.json();
    },
  });
}
