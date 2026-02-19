"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMarketplaceListings, useBuyItem, useCancelListing } from "@/hooks/useMarketplace";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import Skeleton from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";

const ITEM_TYPES = [
  { value: "all", label: "Tous" },
  { value: "skin", label: "Skins" },
  { value: "boost", label: "Boosts" },
  { value: "badge_frame", label: "Cadres" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Plus récents" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
];

export default function MarketplacePage() {
  const { data: session } = useSession();
  const [type, setType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { data: listings, isLoading } = useMarketplaceListings({ type, sortBy });
  const buyMutation = useBuyItem();
  const cancelMutation = useCancelListing();

  return (
    <AnimatedPage>
      <PageHeader title="Marché" subtitle="Achète et vends des items" />

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {ITEM_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              type === t.value
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex justify-end mb-4">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] text-sm text-[var(--text)] border border-[var(--border)]"
          aria-label="Trier par"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : !listings?.length ? (
        <EmptyState
          icon="🏪"
          title="Aucun item en vente"
          description="Le marché est vide pour le moment."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {listings.map((listing: Record<string, unknown>) => (
            <div
              key={listing.id as string}
              className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                    {listing.item_type as string}
                  </span>
                  <p className="mt-1 font-medium text-[var(--text)]">{listing.item_id as string}</p>
                </div>
                <p className="text-lg font-bold text-[var(--accent)]">{listing.price as number} 🪙</p>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                par {(listing.seller as Record<string, unknown>)?.username as string || "Anonyme"}
              </p>
              {session?.user?.id === listing.seller_id ? (
                <button
                  onClick={() => cancelMutation.mutate(listing.id as string)}
                  disabled={cancelMutation.isPending}
                  className="w-full py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  Annuler
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (confirm(`Acheter pour ${listing.price} VeloCoins ?`)) {
                      buyMutation.mutate(listing.id as string);
                    }
                  }}
                  disabled={buyMutation.isPending}
                  className="w-full py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
                >
                  Acheter
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
