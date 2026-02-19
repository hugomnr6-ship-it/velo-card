import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface MarketplaceFilters {
  type?: string;
  sortBy?: string;
  minPrice?: number;
  maxPrice?: number;
}

async function fetchListings(filters: MarketplaceFilters) {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));

  const res = await fetch(`/api/marketplace?${params}`);
  if (!res.ok) throw new Error("Failed to fetch listings");
  return res.json();
}

export function useMarketplaceListings(filters: MarketplaceFilters = {}) {
  return useQuery({
    queryKey: ["marketplace", filters],
    queryFn: () => fetchListings(filters),
    staleTime: 30_000,
  });
}

export function useMyListings() {
  return useQuery({
    queryKey: ["marketplace", "mine"],
    queryFn: async () => {
      const res = await fetch("/api/marketplace?mine=true");
      if (!res.ok) throw new Error("Failed to fetch my listings");
      return res.json();
    },
    staleTime: 30_000,
  });
}

export function useBuyItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (listingId: string) => {
      const res = await fetch(`/api/marketplace/${listingId}/buy`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Achat échoué");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketplace"] });
      qc.invalidateQueries({ queryKey: ["coins"] });
    },
  });
}

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { itemType: string; itemId: string; price: number }) => {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Mise en vente échouée");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketplace"] });
    },
  });
}

export function useCancelListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (listingId: string) => {
      const res = await fetch(`/api/marketplace/${listingId}/cancel`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Annulation échouée");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketplace"] });
    },
  });
}
