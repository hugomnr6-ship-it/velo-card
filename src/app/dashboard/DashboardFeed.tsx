"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { m } from "framer-motion";
import type { CardTier } from "@/types";
import { tierConfig, tierBorderColors } from "@/components/VeloCard";
import { IconStar, IconCycling, IconRoad, IconMountain, IconCalendar, IconTimer, IconSwords, IconShield, IconFlag, IconTrophy, STAT_ICONS } from "@/components/icons/VeloIcons";
import FeedItem from "@/components/FeedItem";

/* ═══ Types ═══ */

interface WeeklyStats {
  km: number;
  dplus: number;
  rides: number;
  time: number;
}

interface EchappeePreview {
  category: string;
  username: string;
  avatar_url: string | null;
  stat_value: number;
  tier: CardTier;
}

const tierAccentHex: Record<CardTier, string> = {
  bronze: "#cd7f32",
  argent: "#C0C8D4",
  platine: "#E0E8F0",
  diamant: "#00D4FF",
  legende: "#FFD700",
};

const categoryIcons: Record<string, string> = {
  ovr: "ovr",
  pac: "pac",
  mon: "mon",
  spr: "spr",
  end: "end",
  res: "res",
  val: "val",
  progression: "progression",
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const mn = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${mn}min`;
  return `${h}h${mn > 0 ? `${String(mn).padStart(2, "0")}` : ""}`;
}

/* ═══ Main Component ═══ */

interface DashboardFeedProps {
  userId: string;
  tier: CardTier;
}

export default function DashboardFeed({ userId, tier }: DashboardFeedProps) {
  const accent = tierAccentHex[tier];

  // React Query: weekly stats
  const { data: weekly } = useQuery<WeeklyStats>({
    queryKey: ["dashboard-weekly", userId],
    queryFn: async () => {
      const res = await fetch("/api/stats/weekly");
      if (!res.ok) throw new Error("Erreur chargement stats");
      const data = await res.json();
      return {
        km: data.km ?? 0,
        dplus: data.dplus ?? 0,
        rides: data.rides ?? 0,
        time: data.time ?? 0,
      };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // React Query: échappée preview
  const { data: echappee = [] } = useQuery<EchappeePreview[]>({
    queryKey: ["dashboard-echappee"],
    queryFn: async () => {
      const res = await fetch("/api/echappee");
      if (!res.ok) return [];
      const data = await res.json();
      return data.team ? data.team.slice(0, 3) : [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // React Query: feed events
  const { data: feedEvents = [] } = useQuery<any[]>({
    queryKey: ["dashboard-feed", userId],
    queryFn: async () => {
      const res = await fetch("/api/feed?limit=10");
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  return (
    <div className="w-full max-w-md flex flex-col gap-4 mt-4">

      {/* ═══ Activity Feed ═══ */}
      {feedEvents.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-4"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px]" style={{ color: accent }}>●</span>
            <p className="text-[10px] font-bold tracking-wider text-white/50">
              ACTIVITE RECENTE
            </p>
          </div>
          <div className="flex flex-col divide-y divide-white/[0.04]">
            {feedEvents.map((event) => (
              <FeedItem key={event.id} event={event} />
            ))}
          </div>
        </m.div>
      )}

      {/* ═══ Weekly Summary ═══ */}
      {weekly && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <IconCycling size={12} className="text-white/50" />
              <p className="text-[10px] font-bold tracking-wider text-white/50">
                CETTE SEMAINE
              </p>
            </div>
            <Link
              href="/profile"
              className="text-[10px] font-bold text-white/40 hover:text-white/40 transition"
            >
              Voir tout &rarr;
            </Link>
          </div>
          <div className="text-[10px] text-white/40 font-medium mb-3">
            Depuis lundi
          </div>
          {weekly.km === 0 && weekly.rides === 0 ? (
            <div className="text-[11px] text-white/40 text-center py-2">
              Pas encore de sortie cette semaine. Ta premiere sortie mettra a jour tes stats ici !
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: IconRoad, value: `${weekly.km.toFixed(1)}`, unit: "km", key: "road" },
                { icon: IconMountain, value: `${weekly.dplus}`, unit: "m D+", key: "mountain" },
                { icon: IconCalendar, value: `${weekly.rides}`, unit: "sorties", key: "calendar" },
                { icon: IconTimer, value: formatTime(weekly.time), unit: "", key: "timer" },
              ].map((item) => (
                <div key={item.key} className="flex flex-col items-center">
                  <item.icon size={16} className="text-white/70" />
                  <span className="text-base font-black text-white font-['JetBrains_Mono']">
                    {item.value}
                  </span>
                  {item.unit && (
                    <span className="text-[8px] text-white/45">{item.unit}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </m.div>
      )}

      {/* ═══ L'Échappée Teaser ═══ */}
      {echappee.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/echappee" className="block">
            <div className="glass rounded-2xl border-[#FFD700]/15 bg-gradient-to-r from-[#FFD700]/[0.06] to-transparent p-4 transition hover:border-[#FFD700]/25">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <IconStar size={12} className="text-[#FFD700]/60" />
                  <p className="text-[10px] font-bold tracking-wider text-[#FFD700]/60">
                    L'ÉCHAPPÉE DE LA SEMAINE
                  </p>
                </div>
                <span className="text-[10px] text-white/40">Voir →</span>
              </div>
              <div className="flex flex-col gap-2">
                {echappee.map((player) => {
                  const iconKey = categoryIcons[player.category];
                  const IconComponent = iconKey && STAT_ICONS[iconKey];
                  return (
                  <div key={player.category} className="flex items-center gap-2.5">
                    <div className="w-6 flex justify-center">
                      {IconComponent ? <IconComponent size={16} className="text-white/70" /> : <span>•</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {player.avatar_url && (
                        <img
                          src={`/api/img?url=${encodeURIComponent(player.avatar_url)}`}
                          alt={`Photo de ${player.username}`}
                          className="h-5 w-5 rounded-full border border-white/10 object-cover"
                        />
                      )}
                      <span className="text-xs font-semibold text-white/70 truncate">
                        {player.username}
                      </span>
                    </div>
                    <span
                      className="text-sm font-black font-['JetBrains_Mono']"
                      style={{ color: tierAccentHex[player.tier] }}
                    >
                      {player.stat_value}
                    </span>
                  </div>
                  );
                })}
              </div>
            </div>
          </Link>
        </m.div>
      )}

      {/* ═══ Quick Links ═══ */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-2"
      >
        <Link
          href="/duels"
          className="glass-light glass-hover rounded-xl border-[#6366F1]/15 p-3.5"
        >
          <IconSwords size={20} className="text-[#6366F1]" />
          <p className="mt-1 text-xs font-bold text-white">Duels</p>
          <p className="text-[9px] text-[#94A3B8]">Défie tes rivaux en 1v1</p>
        </Link>
        <Link
          href="/clubs"
          className="glass-light glass-hover rounded-xl p-3.5"
        >
          <IconShield size={20} className="text-white/60" />
          <p className="mt-1 text-xs font-bold text-white">Clubs</p>
          <p className="text-[9px] text-[#94A3B8]">Rejoins ou crée un club</p>
        </Link>
        <Link
          href="/wars"
          className="glass-light glass-hover rounded-xl p-3.5"
        >
          <IconSwords size={20} className="text-white/60" />
          <p className="mt-1 text-xs font-bold text-white">Guerres</p>
          <p className="text-[9px] text-[#94A3B8]">Bataille des pelotons</p>
        </Link>
        <Link
          href="/races"
          className="glass-light glass-hover rounded-xl p-3.5"
        >
          <IconFlag size={20} className="text-white/60" />
          <p className="mt-1 text-xs font-bold text-white">Courses</p>
          <p className="text-[9px] text-[#94A3B8]">Événements à venir</p>
        </Link>
        <Link
          href="/leaderboard"
          className="glass-light glass-hover rounded-xl p-3.5"
        >
          <IconTrophy size={20} className="text-[#FFD700]/70" />
          <p className="mt-1 text-xs font-bold text-white">Classement</p>
          <p className="text-[9px] text-[#94A3B8]">Ta position régionale</p>
        </Link>
      </m.div>
    </div>
  );
}
