"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Skeleton from "@/components/Skeleton";
import type { RaceWithCreator } from "@/types";

// Nombre max de courses affichées
const MAX_RACES = 3;

// Nombre de jours à l'avance pour les courses à venir
const DAYS_AHEAD = 7;

// ——— Skeleton ———
function WeekendRacesSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
    </div>
  );
}

/**
 * Widget "Mes courses cette semaine" pour le dashboard.
 * Affiche les courses favorites à venir dans les 7 prochains jours.
 * Si pas de favoris, affiche les prochaines courses générales.
 * Si aucune course, le widget ne s'affiche pas.
 */
export default function WeekendRacesWidget() {
  // Fetch les favoris de type race
  const { data: favorites } = useQuery<{ entity_id: string }[]>({
    queryKey: ["favorites", "race"],
    queryFn: async () => {
      const res = await fetch("/api/favorites?entity_type=race");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch les courses à venir (7 prochains jours)
  const { data: upcomingRaces, isLoading } = useQuery<RaceWithCreator[]>({
    queryKey: ["upcoming-races-widget"],
    queryFn: async () => {
      const res = await fetch("/api/races?upcoming=true&limit=20");
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.races || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) return <WeekendRacesSkeleton />;

  if (!upcomingRaces || upcomingRaces.length === 0) return null;

  // Filtrer les courses dans les 7 prochains jours
  const now = new Date();
  const cutoff = new Date(now.getTime() + DAYS_AHEAD * 24 * 60 * 60 * 1000);
  const thisWeek = upcomingRaces.filter((r) => {
    const d = new Date(r.date);
    return d >= now && d <= cutoff;
  });

  if (thisWeek.length === 0) return null;

  // Privilégier les courses favorites
  const favoriteIds = new Set((favorites || []).map((f) => f.entity_id));
  const favoriteRaces = thisWeek.filter((r) => favoriteIds.has(r.id));
  const displayRaces = favoriteRaces.length > 0
    ? favoriteRaces.slice(0, MAX_RACES)
    : thisWeek.slice(0, MAX_RACES);

  const isFavoriteSection = favoriteRaces.length > 0;

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="w-full max-w-md"
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold text-[#94A3B8]">
          {isFavoriteSection ? "Tes courses cette semaine" : "Courses a venir"}
        </h3>
        <Link
          href="/races"
          className="text-[10px] font-bold text-[#6366F1] transition hover:text-[#818CF8]"
        >
          Voir tout
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {displayRaces.map((race) => (
          <WeekendRaceCard key={race.id} race={race} isFavorite={favoriteIds.has(race.id)} />
        ))}
      </div>
    </m.div>
  );
}

// ——— Card pour une course ———
function WeekendRaceCard({ race, isFavorite }: { race: RaceWithCreator; isFavorite: boolean }) {
  const d = new Date(race.date);
  const dayName = d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
  const day = d.getDate();
  const month = d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");

  return (
    <Link href={`/races/${race.id}`}>
      <m.div
        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-2.5 transition hover:border-[#6366F1]/20 hover:bg-[#22223A]/60"
        whileTap={{ scale: 0.98 }}
      >
        {/* Date */}
        <div className="flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-[#6366F1]/10">
          <span className="text-[10px] font-bold uppercase leading-none text-[#6366F1]">{dayName}</span>
          <span className="text-sm font-black leading-tight text-white">{day}</span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-xs font-bold text-white">{race.name}</p>
            {isFavorite && <span className="text-[10px] text-red-400">&#10084;</span>}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#64748B]">
            <span>{race.location}</span>
            {race.distance_km && <span>· {race.distance_km}km</span>}
            {race.elevation_gain && <span>· D+{race.elevation_gain}m</span>}
          </div>
        </div>

        {/* Chevron */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-[#475569]">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </m.div>
    </Link>
  );
}
