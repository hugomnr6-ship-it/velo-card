import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface PackDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost_coins: number;
  items_count: number;
}

export interface InventoryItem {
  id: string;
  item: {
    id: string;
    name: string;
    description: string;
    icon: string;
    item_type: string;
    rarity: string;
    effect: Record<string, any> | null;
  };
  obtained_from: string;
  is_active: boolean;
  expires_at: string | null;
  equipped: boolean;
  created_at: string;
}

export function usePacks() {
  return useQuery<PackDefinition[]>({
    queryKey: ["packs"],
    queryFn: async () => {
      const res = await fetch("/api/packs");
      if (!res.ok) throw new Error("Erreur packs");
      return res.json();
    },
  });
}

export function useInventory() {
  return useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("Erreur inventaire");
      return res.json();
    },
  });
}

export function useOpenPack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (packId: string) => {
      const res = await fetch("/api/packs/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur ouverture");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coins"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["packs"] });
    },
  });
}

export function useEquipSkin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (skinId: string) => {
      const res = await fetch("/api/skins/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skinId }),
      });
      if (!res.ok) throw new Error("Erreur equipement");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}
