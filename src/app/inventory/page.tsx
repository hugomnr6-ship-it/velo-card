"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { m } from "framer-motion";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { AnimatedList, AnimatedListItem } from "@/components/AnimatedList";
import Skeleton from "@/components/Skeleton";
import { useInventory, useEquipSkin } from "@/hooks/usePacks";
import { useToast } from "@/contexts/ToastContext";

const rarityColors: Record<string, string> = {
  common: "#94A3B8",
  rare: "#6366F1",
  epic: "#A78BFA",
  legendary: "#FFD700",
};

const typeLabels: Record<string, string> = {
  stat_boost: "Boost",
  skin: "Skin",
  coins: "Coins",
};

export default function InventoryPage() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { data: inventory, isLoading } = useInventory();
  const equipSkin = useEquipSkin();
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  const filtered = (inventory || []).filter((item) => {
    if (filter === "all") return true;
    return item.item?.item_type === filter;
  });

  const activeBoosts = (inventory || []).filter(
    (i) => i.item?.item_type === "stat_boost" && i.is_active && i.expires_at && new Date(i.expires_at) > new Date()
  );

  if (status === "loading" || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <div className="w-full max-w-md">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="mb-3 h-16 w-full rounded-xl" />
          ))}
        </div>
      </main>
    );
  }

  async function handleEquip(skinId: string) {
    try {
      await equipSkin.mutateAsync(skinId);
      toast("Skin equipe !", "success");
    } catch {
      toast("Erreur equipement", "error");
    }
  }

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-md">
        <PageHeader
          icon={<span className="text-2xl">&#127890;</span>}
          title="Inventaire"
          subtitle={`${(inventory || []).length} items`}
        />

        {/* Active boosts banner */}
        {activeBoosts.length > 0 && (
          <div className="mb-4 rounded-xl border border-[#00F5D4]/20 bg-[#00F5D4]/5 p-3">
            <p className="mb-1 text-xs font-bold text-[#00F5D4]">Boosts actifs</p>
            <div className="flex flex-wrap gap-2">
              {activeBoosts.map((boost) => (
                <span
                  key={boost.id}
                  className="rounded-full border border-[#00F5D4]/20 bg-[#00F5D4]/10 px-2 py-0.5 text-[10px] font-bold text-[#00F5D4]"
                >
                  {boost.item?.icon} {boost.item?.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="mb-4 flex gap-1 rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-1">
          {[
            { key: "all", label: "Tout" },
            { key: "stat_boost", label: "Boosts" },
            { key: "skin", label: "Skins" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`relative flex-1 rounded-lg py-2 text-xs font-bold transition ${
                filter === tab.key ? "text-black" : "text-[#94A3B8]"
              }`}
            >
              {filter === tab.key && (
                <m.div
                  layoutId="inv-tab"
                  className="absolute inset-0 rounded-lg bg-white"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<span className="text-4xl">&#128230;</span>}
            title="Inventaire vide"
            description="Ouvre des packs pour obtenir des items !"
            action={{ label: "Voir les packs", href: "/packs" }}
          />
        ) : (
          <AnimatedList className="flex flex-col gap-2">
            {filtered.map((inv) => {
              const item = inv.item;
              if (!item) return null;
              const color = rarityColors[item.rarity] || "#94A3B8";
              const isSkin = item.item_type === "skin";
              const isExpired = inv.expires_at && new Date(inv.expires_at) < new Date();

              return (
                <AnimatedListItem key={inv.id}>
                  <div
                    className={`flex items-center gap-3 rounded-xl border p-3 ${
                      isExpired
                        ? "border-white/[0.04] bg-[#1A1A2E]/30 opacity-50"
                        : "border-white/[0.06] bg-[#1A1A2E]/60"
                    }`}
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg"
                      style={{ background: `${color}10`, border: `1px solid ${color}30` }}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white">{item.name}</p>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color }}
                        >
                          {typeLabels[item.item_type] || item.item_type}
                        </span>
                        {inv.is_active && !isExpired && (
                          <span className="text-[10px] font-bold text-[#00F5D4]">Actif</span>
                        )}
                        {isExpired && (
                          <span className="text-[10px] font-bold text-red-400">Expire</span>
                        )}
                      </div>
                    </div>
                    {isSkin && !inv.equipped && (
                      <button
                        onClick={() => handleEquip(item.id)}
                        className="rounded-lg bg-[#6366F1] px-3 py-1.5 text-xs font-bold text-white"
                      >
                        Equiper
                      </button>
                    )}
                    {isSkin && inv.equipped && (
                      <span className="rounded-lg border border-[#00F5D4]/20 bg-[#00F5D4]/10 px-3 py-1.5 text-xs font-bold text-[#00F5D4]">
                        Equipe
                      </span>
                    )}
                  </div>
                </AnimatedListItem>
              );
            })}
          </AnimatedList>
        )}
      </div>
    </AnimatedPage>
  );
}
