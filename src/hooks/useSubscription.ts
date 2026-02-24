"use client";

import { useQuery, useMutation } from "@tanstack/react-query";

export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await fetch("/api/subscription");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5min cache
  });
}

export function useIsPro() {
  const { data } = useSubscription();
  return data?.isPro ?? false;
}

export function useCheckout() {
  return useMutation({
    mutationFn: async ({ plan, returnPath }: { plan: "pro_monthly" | "pro_yearly"; returnPath?: string }) => {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, returnPath }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      return data;
    },
  });
}

export function useCoinsCheckout() {
  return useMutation({
    mutationFn: async ({ coinPackId }: { coinPackId: string }) => {
      const res = await fetch("/api/checkout/coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coinPackId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      return data;
    },
  });
}

export function useBillingPortal() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/billing-portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      return data;
    },
  });
}
