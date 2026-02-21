import { useQuery } from "@tanstack/react-query";

interface BetaInfo {
  isBetaTester: boolean;
  betaNumber: number | null;
  enrolledAt: string | null;
  totalBetaTesters: number;
  maxBetaTesters: number;
  spotsLeft: number;
}

export function useBeta() {
  return useQuery<BetaInfo>({
    queryKey: ["beta"],
    queryFn: async () => {
      const res = await fetch("/api/beta");
      if (!res.ok) throw new Error("Erreur beta info");
      return res.json();
    },
  });
}
