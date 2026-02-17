"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import { AnimatedList, AnimatedListItem } from "@/components/AnimatedList";
import Skeleton from "@/components/Skeleton";
import { useCoins } from "@/hooks/useCoins";
import { usePacks, useOpenPack } from "@/hooks/usePacks";
import { useToast } from "@/contexts/ToastContext";
import CoinShop from "@/components/CoinShop";

const rarityColors: Record<string, string> = {
  common: "#94A3B8",
  rare: "#6366F1",
  epic: "#A78BFA",
  legendary: "#FFD700",
};

const rarityLabels: Record<string, string> = {
  common: "Commun",
  rare: "Rare",
  epic: "Epique",
  legendary: "Legendaire",
};

export default function PacksPage() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { data: coins } = useCoins();
  const { data: packs, isLoading } = usePacks();
  const openPack = useOpenPack();
  const [openedItems, setOpenedItems] = useState<any[] | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  async function handleOpen(packId: string) {
    setOpening(true);
    setOpenedItems(null);
    setRevealIndex(0);
    try {
      const result = await openPack.mutateAsync(packId);
      setOpenedItems(result.items);
    } catch (err: any) {
      toast(err.message || "Erreur ouverture", "error");
      setOpening(false);
    }
  }

  function handleRevealNext() {
    if (openedItems && revealIndex < openedItems.length - 1) {
      setRevealIndex((i) => i + 1);
    } else {
      setOpenedItems(null);
      setOpening(false);
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <div className="w-full max-w-md">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="mb-4 h-32 w-full rounded-xl" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-md">
        <PageHeader
          icon={<span className="text-2xl">&#128230;</span>}
          title="Packs"
          subtitle={coins ? `${coins.balance} VeloCoins` : undefined}
        />

        {/* Pack opening overlay */}
        <AnimatePresence>
          {openedItems && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
              onClick={handleRevealNext}
            >
              <m.div
                key={revealIndex}
                initial={{ scale: 0.5, opacity: 0, rotateY: 180 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex flex-col items-center gap-4"
              >
                <div
                  className="flex h-40 w-40 flex-col items-center justify-center rounded-2xl border-2"
                  style={{
                    borderColor: rarityColors[openedItems[revealIndex].rarity] || "#94A3B8",
                    background: `linear-gradient(135deg, #1A1A2E, ${rarityColors[openedItems[revealIndex].rarity]}15)`,
                    boxShadow: `0 0 40px ${rarityColors[openedItems[revealIndex].rarity]}30`,
                  }}
                >
                  <span className="text-4xl">{openedItems[revealIndex].icon}</span>
                  <p className="mt-2 text-center text-sm font-bold text-white">
                    {openedItems[revealIndex].name}
                  </p>
                  <p
                    className="mt-1 text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: rarityColors[openedItems[revealIndex].rarity] }}
                  >
                    {rarityLabels[openedItems[revealIndex].rarity]}
                  </p>
                </div>
                <p className="text-xs text-white/40">
                  {revealIndex + 1}/{openedItems.length} — Touche pour continuer
                </p>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Packs list */}
        <AnimatedList className="flex flex-col gap-4">
          {(packs || []).map((pack) => {
            const canAfford = (coins?.balance || 0) >= pack.cost_coins;
            return (
              <AnimatedListItem key={pack.id}>
                <m.div
                  className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-3xl">
                        {pack.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-white">{pack.name}</p>
                        <p className="text-xs text-[#94A3B8]">{pack.description}</p>
                        <p className="mt-1 text-[10px] text-[#64748B]">
                          {pack.items_count} items
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpen(pack.id)}
                    disabled={!canAfford || opening}
                    className={`flex w-full items-center justify-center gap-2 py-3 text-sm font-bold transition ${
                      canAfford && !opening
                        ? "bg-[#6366F1] text-white hover:bg-[#6366F1]/80"
                        : "bg-white/[0.04] text-[#475569] cursor-not-allowed"
                    }`}
                  >
                    <span>&#128176;</span>
                    <span>{pack.cost_coins} VeloCoins</span>
                  </button>
                </m.div>
              </AnimatedListItem>
            );
          })}
        </AnimatedList>

        {/* Boutique VeloCoins (achat réel) */}
        <CoinShop />
      </div>
    </AnimatedPage>
  );
}
