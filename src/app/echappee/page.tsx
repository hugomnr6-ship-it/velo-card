"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import { AnimatedList, AnimatedListItem } from "@/components/AnimatedList";
import type { CardTier, ComputedStats } from "@/types";
import { tierConfig, tierBorderColors } from "@/components/VeloCard";
import { IconCycling, STAT_ICONS } from "@/components/icons/VeloIcons";

interface EchappeePlayer {
  category: string;
  stat_value: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  tier: CardTier;
  ovr: number;
  stats: ComputedStats;
}

interface EchappeeData {
  week: string;
  team: EchappeePlayer[];
}

const categoryLabels: Record<string, string> = {
  ovr: "Meilleur Coureur",
  pac: "Plus Rapide",
  mon: "Meilleur Grimpeur",
  spr: "Meilleur Sprinteur",
  end: "Plus Endurant",
  res: "Plus Puissant",
  val: "Plus Technique",
  progression: "Meilleure Progression",
};

const tierAccentHex: Record<CardTier, string> = {
  bronze: "#cd7f32",
  argent: "#B8A0D8",
  platine: "#E0E8F0",
  diamant: "#B9F2FF",
  legende: "#FFD700",
};

export default function EchappeePage() {
  const [data, setData] = useState<EchappeeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/echappee")
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center gap-6 px-4 pb-24 pt-12">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/5" />
        <div className="flex flex-col gap-3 w-full max-w-md">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      </main>
    );
  }

  if (!data || !data.team || data.team.length === 0) {
    return (
      <AnimatedPage className="flex min-h-screen flex-col items-center gap-6 px-4 pb-24 pt-12">
        <PageHeader
          icon={<IconCycling size={24} className="text-white/60" />}
          title="L'Échappée de la Semaine"
        />
        <p className="text-sm text-white/40">
          Pas encore d'Échappée cette semaine. Reviens lundi !
        </p>
      </AnimatedPage>
    );
  }

  // Sort: ovr first, then pac, mon, spr, end, res, val, progression
  const order = ["ovr", "pac", "mon", "spr", "end", "res", "val", "progression"];
  const sorted = [...data.team].sort(
    (a, b) => order.indexOf(a.category) - order.indexOf(b.category)
  );

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center gap-6 px-4 pb-24 pt-12">
      {/* Header with gold styling */}
      <div className="flex flex-col items-center gap-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="flex items-center gap-2"
        >
          <IconCycling size={28} className="text-[#FFD700]/60" />
          <h1 className="text-xl font-black tracking-wider text-[#FFD700] font-['Space_Grotesk']">
            L'ÉCHAPPÉE
          </h1>
          <IconCycling size={28} className="text-[#FFD700]/60" />
        </motion.div>
        <p className="text-[10px] font-bold tracking-[0.2em] text-white/30">
          DE LA SEMAINE
        </p>
        <p className="text-xs text-white/40">Semaine {data.week}</p>
      </div>

      {/* Échappée Grid */}
      <AnimatedList className="w-full max-w-md flex flex-col gap-3">
        {sorted.map((player) => {
          const catLabel = categoryLabels[player.category] || player.category;
          const CatIcon = STAT_ICONS[player.category];
          const accent = tierAccentHex[player.tier];
          const config = tierConfig[player.tier];

          return (
            <AnimatedListItem key={player.category}>
              <div
                className={`relative overflow-hidden rounded-xl border ${tierBorderColors[player.tier]} bg-gradient-to-r ${config.bg} p-4`}
                style={{
                  boxShadow: `0 0 20px ${accent}08`,
                }}
              >
                {/* Gold left accent for OVR winner */}
                {player.category === "ovr" && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ background: "linear-gradient(180deg, #FFD700, #FF8C00)" }}
                  />
                )}

                <div className="flex items-center gap-3">
                  {/* Category badge */}
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: `${accent}10`,
                      border: `1px solid ${accent}30`,
                    }}
                  >
                    {CatIcon ? <CatIcon size={20} className="text-white/70" /> : null}
                  </div>

                  {/* Player info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold tracking-wider text-white/40">
                      {catLabel.toUpperCase()}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {player.avatar_url && (
                        <img
                          src={`/api/img?url=${encodeURIComponent(player.avatar_url)}`}
                          alt=""
                          className="h-6 w-6 rounded-full border border-white/10 object-cover"
                        />
                      )}
                      <p className="truncate text-sm font-bold text-white font-['Space_Grotesk']">
                        {player.username}
                      </p>
                    </div>
                  </div>

                  {/* Stat value */}
                  <div className="flex flex-col items-end">
                    <span
                      className="text-2xl font-black font-['JetBrains_Mono']"
                      style={{ color: accent }}
                    >
                      {player.stat_value}
                    </span>
                    <span className="text-[9px] font-bold tracking-wider text-white/30">
                      {player.category === "progression" ? "+OVR" : player.category.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </AnimatedListItem>
          );
        })}
      </AnimatedList>
    </AnimatedPage>
  );
}
