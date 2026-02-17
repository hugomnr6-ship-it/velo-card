import { useQuery } from "@tanstack/react-query";

export interface CoinInfo {
  balance: number;
  total_earned: number;
  total_spent: number;
}

export interface CoinTransaction {
  id: string;
  amount: number;
  reason: string;
  metadata: Record<string, any>;
  created_at: string;
}

export function useCoins() {
  return useQuery<CoinInfo>({
    queryKey: ["coins"],
    queryFn: async () => {
      const res = await fetch("/api/coins");
      if (!res.ok) throw new Error("Erreur coins");
      return res.json();
    },
  });
}

export function useCoinHistory(limit = 50, offset = 0) {
  return useQuery<CoinTransaction[]>({
    queryKey: ["coins-history", limit, offset],
    queryFn: async () => {
      const res = await fetch(`/api/coins/history?limit=${limit}&offset=${offset}`);
      if (!res.ok) throw new Error("Erreur historique");
      return res.json();
    },
  });
}
