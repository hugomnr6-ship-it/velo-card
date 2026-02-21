import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ShopItem {
  id: string;
  skinId: string;
  name: string;
  description: string;
  skinType: string;
  rarity: string;
  previewUrl: string | null;
  priceCoins: number;
  isFeatured: boolean;
  owned: boolean;
}

export interface ShopRotation {
  id: string;
  starts_at: string;
  ends_at: string;
}

export interface ShopData {
  rotation: ShopRotation | null;
  items: ShopItem[];
}

export function useShop() {
  return useQuery<ShopData>({
    queryKey: ["shop"],
    queryFn: async () => {
      const res = await fetch("/api/shop");
      if (!res.ok) throw new Error("Erreur chargement shop");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}

export function useBuySkin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shopItemId: string) => {
      const res = await fetch("/api/shop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopItemId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur achat");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop"] });
      queryClient.invalidateQueries({ queryKey: ["coins"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}
