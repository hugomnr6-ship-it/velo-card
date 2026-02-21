"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import Skeleton from "@/components/Skeleton";
import { useCoins } from "@/hooks/useCoins";
import { useShop, useBuySkin, type ShopItem } from "@/hooks/useShop";
import { useBeta } from "@/hooks/useBeta";
import { useCardPreview } from "@/hooks/useCardPreview";
import { useToast } from "@/contexts/ToastContext";
import CoinShop from "@/components/CoinShop";
import SkinPreviewCard from "./SkinPreviewCard";

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

function useCountdown(endDate: string | undefined) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!endDate) return;
    const update = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Rotation...");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const mn = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(d > 0 ? `${d}j ${h}h ${mn}m` : `${h}h ${mn}m`);
    };
    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, [endDate]);
  return timeLeft;
}

export default function ShopPage() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { data: coins } = useCoins();
  const { data: shop, isLoading } = useShop();
  const { data: betaInfo } = useBeta();
  const { data: cardData } = useCardPreview();
  const buySkin = useBuySkin();
  const [previewSkin, setPreviewSkin] = useState<ShopItem | null>(null);
  const [buying, setBuying] = useState<string | null>(null);

  const countdown = useCountdown(shop?.rotation?.ends_at);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  async function handleBuy(item: ShopItem) {
    setBuying(item.id);
    try {
      await buySkin.mutateAsync(item.id);
      toast(`${item.name} acheté !`, "success");
    } catch (err: any) {
      toast(err.message || "Erreur achat", "error");
    } finally {
      setBuying(null);
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <div className="w-full max-w-md">
          <Skeleton className="mb-4 h-10 w-48" />
          <Skeleton className="mb-4 h-80 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  const featured = shop?.items.find((i) => i.isFeatured);
  const regular = shop?.items.filter((i) => !i.isFeatured) || [];
  const balance = coins?.balance || 0;

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <PageHeader
          icon={<span className="text-2xl">&#128722;</span>}
          title="Boutique"
          subtitle={coins ? `${coins.balance} VeloCoins` : undefined}
        />

        {/* Countdown */}
        {countdown && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-white/[0.06] bg-[#1A1A2E]/60 py-2">
            <span className="text-xs text-[#64748B]">Rotation dans</span>
            <span className="font-mono text-sm font-bold text-[#6366F1]">{countdown}</span>
          </div>
        )}

        {/* Beta card banner — GLITCH green */}
        {betaInfo && betaInfo.isBetaTester && (
          <div className="mb-4 rounded-xl border border-[#00FF41]/20 bg-gradient-to-br from-[#030A04] to-[#081408] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#00FF41]/30 bg-[#00FF41]/8 font-['JetBrains_Mono'] text-[8px] font-extrabold text-[#00FF41]">
                BETA
              </div>
              <div>
                <p className="text-sm font-bold text-[#00FF41]">Carte PROTOTYPE</p>
                <p className="text-[10px] text-[#00FF41]/40">
                  Beta Testeur #{String(betaInfo.betaNumber).padStart(3, "0")}/050 — Exclusive, jamais reproductible
                </p>
              </div>
            </div>
            {/* Preview de la carte prototype dans le banner */}
            {cardData && (
              <div className="mt-3 flex justify-center">
                <SkinPreviewCard cardData={cardData} skinId="prototype" size="sm" />
              </div>
            )}
            <p className="mt-2 text-[11px] text-[#00FF41]/25">
              Tu fais partie des {betaInfo.totalBetaTesters} premiers testeurs. Cette carte ne sera plus jamais disponible.
            </p>
          </div>
        )}

        {/* If not beta tester but spots left — GLITCH green */}
        {betaInfo && !betaInfo.isBetaTester && betaInfo.spotsLeft > 0 && (
          <div className="mb-4 rounded-xl border border-[#00FF41]/10 bg-gradient-to-br from-[#030A04]/60 to-[#081408]/60 p-4">
            <p className="text-sm font-bold text-[#00FF41]">Carte PROTOTYPE — Edition limitée</p>
            <p className="text-[11px] text-[#00FF41]/35">
              Plus que {betaInfo.spotsLeft} places pour obtenir cette carte exclusive.
              Elle ne sera plus JAMAIS disponible après la beta.
            </p>
          </div>
        )}

        {/* No rotation */}
        {!shop?.rotation && (
          <div className="rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-8 text-center">
            <p className="text-lg">&#128683;</p>
            <p className="mt-2 text-sm text-[#94A3B8]">Aucune rotation active pour le moment.</p>
            <p className="mt-1 text-xs text-[#64748B]">Reviens bientôt !</p>
          </div>
        )}

        {/* Featured item */}
        {featured && (
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 overflow-hidden rounded-xl border-2"
            style={{
              borderColor: `${rarityColors[featured.rarity]}40`,
              background: `linear-gradient(135deg, #1A1A2E, ${rarityColors[featured.rarity]}10)`,
            }}
          >
            <div
              className="relative flex cursor-pointer flex-col items-center p-5"
              onClick={() => setPreviewSkin(featured)}
            >
              {/* Glow */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: `radial-gradient(ellipse at center, ${rarityColors[featured.rarity]}40, transparent 70%)`,
                }}
              />
              {/* Featured badge */}
              <div className="relative mb-3 flex items-center gap-1.5">
                <span className="text-xs">&#11088;</span>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: rarityColors[featured.rarity] }}
                >
                  En vedette
                </span>
              </div>
              {/* Card preview */}
              <div className="relative mb-3">
                {cardData ? (
                  <SkinPreviewCard cardData={cardData} skinId={featured.skinId} size="lg" />
                ) : (
                  <div
                    className="flex items-center justify-center rounded-lg"
                    style={{
                      width: 163,
                      height: 273,
                      background: `linear-gradient(135deg, ${rarityColors[featured.rarity]}20, transparent)`,
                      border: `1px solid ${rarityColors[featured.rarity]}30`,
                    }}
                  >
                    <span className="text-4xl opacity-60">&#127912;</span>
                  </div>
                )}
              </div>
              <p className="relative text-lg font-bold text-white">{featured.name}</p>
              <p className="relative text-xs text-[#94A3B8]">{featured.description}</p>
              <span
                className="relative mt-1 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: rarityColors[featured.rarity] }}
              >
                {rarityLabels[featured.rarity]}
              </span>
            </div>
            <ShopBuyButton
              item={featured}
              balance={balance}
              buying={buying}
              onBuy={handleBuy}
            />
          </m.div>
        )}

        {/* Regular items grid */}
        {regular.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            {regular.map((item, i) => (
              <m.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60"
              >
                <div
                  className="flex cursor-pointer flex-col items-center p-3"
                  onClick={() => setPreviewSkin(item)}
                >
                  {/* Card preview */}
                  <div className="mb-2">
                    {cardData ? (
                      <SkinPreviewCard cardData={cardData} skinId={item.skinId} size="sm" />
                    ) : (
                      <div
                        className="flex items-center justify-center rounded-lg"
                        style={{
                          width: 107,
                          height: 179,
                          background: `linear-gradient(135deg, ${rarityColors[item.rarity]}15, transparent)`,
                          border: `1px solid ${rarityColors[item.rarity]}20`,
                        }}
                      >
                        <span className="text-2xl opacity-50">&#127912;</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-bold text-white">{item.name}</p>
                  <span
                    className="mt-0.5 text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: rarityColors[item.rarity] }}
                  >
                    {rarityLabels[item.rarity]}
                  </span>
                </div>
                <ShopBuyButton
                  item={item}
                  balance={balance}
                  buying={buying}
                  onBuy={handleBuy}
                />
              </m.div>
            ))}
          </div>
        )}

        {/* Boutique VeloCoins (achat réel) */}
        <CoinShop />
      </div>

      {/* Preview modal — full card with skin */}
      <AnimatePresence>
        {previewSkin && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setPreviewSkin(null)}
          >
            <m.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="flex flex-col items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glow behind the card */}
              <div
                className="pointer-events-none absolute -inset-10 opacity-25 blur-[60px]"
                style={{
                  background: `radial-gradient(ellipse at center, ${rarityColors[previewSkin.rarity]}, transparent 70%)`,
                }}
              />

              {/* Card preview */}
              <div className="relative">
                {cardData ? (
                  <SkinPreviewCard cardData={cardData} skinId={previewSkin.skinId} size="lg" />
                ) : (
                  <div
                    className="flex h-[273px] w-[163px] flex-col items-center justify-center rounded-2xl border-2"
                    style={{
                      borderColor: `${rarityColors[previewSkin.rarity]}60`,
                      background: `linear-gradient(135deg, #1A1A2E, ${rarityColors[previewSkin.rarity]}15)`,
                    }}
                  >
                    <span className="text-5xl">&#127912;</span>
                  </div>
                )}
              </div>

              {/* Skin info */}
              <div className="text-center">
                <p className="text-lg font-bold text-white">{previewSkin.name}</p>
                <p className="text-xs text-[#94A3B8]">{previewSkin.description}</p>
                <span
                  className="mt-1 inline-block text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: rarityColors[previewSkin.rarity] }}
                >
                  {rarityLabels[previewSkin.rarity]}
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-2">
                <span>&#128176;</span>
                <span className="text-lg font-bold text-[#FFD700]">{previewSkin.priceCoins}</span>
              </div>

              {/* Actions */}
              {!previewSkin.owned && balance >= previewSkin.priceCoins && (
                <button
                  onClick={() => {
                    handleBuy(previewSkin);
                    setPreviewSkin(null);
                  }}
                  className="rounded-full bg-[#6366F1] px-8 py-2.5 text-sm font-bold text-white transition hover:bg-[#6366F1]/80"
                >
                  Acheter
                </button>
              )}
              {!previewSkin.owned && balance < previewSkin.priceCoins && (
                <p className="text-xs text-[#64748B]">
                  Il te manque {previewSkin.priceCoins - balance} VeloCoins
                </p>
              )}
              {previewSkin.owned && (
                <span className="text-sm font-bold text-[#00F5D4]">Deja possédé</span>
              )}
              <button
                onClick={() => setPreviewSkin(null)}
                className="text-xs text-[#64748B] transition hover:text-white"
              >
                Fermer
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}

function ShopBuyButton({
  item,
  balance,
  buying,
  onBuy,
}: {
  item: ShopItem;
  balance: number;
  buying: string | null;
  onBuy: (item: ShopItem) => void;
}) {
  if (item.owned) {
    return (
      <div className="flex w-full items-center justify-center gap-2 bg-[#00F5D4]/10 py-2.5 text-sm font-bold text-[#00F5D4]">
        <span>&#10003;</span>
        <span>Possédé</span>
      </div>
    );
  }

  const canAfford = balance >= item.priceCoins;
  const isBuying = buying === item.id;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onBuy(item);
      }}
      disabled={!canAfford || !!buying}
      className={`flex w-full items-center justify-center gap-2 py-2.5 text-sm font-bold transition ${
        canAfford && !buying
          ? "bg-[#6366F1] text-white hover:bg-[#6366F1]/80"
          : "cursor-not-allowed bg-white/[0.04] text-[#475569]"
      }`}
    >
      {isBuying ? (
        <span className="animate-pulse">Achat...</span>
      ) : (
        <>
          <span>&#128176;</span>
          <span>{item.priceCoins}</span>
          {!canAfford && <span className="text-[10px] opacity-60">Pas assez</span>}
        </>
      )}
    </button>
  );
}
