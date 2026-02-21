"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import BookmarkButton from "@/components/BookmarkButton";
import Skeleton from "@/components/Skeleton";
import { useFavorites } from "@/hooks/useFavorites";
import type { RaceWithCreator } from "@/types";

// Types d'onglets
const TABS = [
  { key: "race" as const, label: "Courses" },
  { key: "route" as const, label: "Parcours" },
  { key: "profile" as const, label: "Profils" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ——— Federation badge colors ———
const fedColors: Record<string, { bg: string; text: string }> = {
  FFC: { bg: "bg-blue-500/15", text: "text-blue-400" },
  UFOLEP: { bg: "bg-green-500/15", text: "text-green-400" },
  FSGT: { bg: "bg-orange-500/15", text: "text-orange-400" },
  OTHER: { bg: "bg-gray-500/15", text: "text-gray-400" },
};

// ——— Skeleton pour la liste ———
function FavoritesListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}

// ——— Race row pour les favoris ———
function FavoriteRaceRow({ race }: { race: RaceWithCreator }) {
  const d = new Date(race.date);
  const day = d.getDate();
  const month = d.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase().replace(".", "");
  const fed = fedColors[race.federation] || fedColors.OTHER;

  return (
    <Link href={`/races/${race.id}`}>
      <m.div
        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-3 transition hover:border-[#6366F1]/20 hover:bg-[#22223A]/60"
        whileTap={{ scale: 0.98 }}
      >
        {/* Date badge */}
        <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-[#6366F1]/10">
          <span className="text-lg font-black leading-none text-white">{day}</span>
          <span className="text-[9px] font-bold text-[#6366F1]">{month}</span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{race.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#64748B]">
            <span>{race.location}</span>
            {race.distance_km && <span>· {race.distance_km} km</span>}
            {race.elevation_gain && <span>· D+ {race.elevation_gain}m</span>}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${fed.bg} ${fed.text}`}>
            {race.federation}
          </span>
          {race.rdi_score && (
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
              race.rdi_score >= 7 ? "bg-red-500/15 text-red-400" :
              race.rdi_score >= 4 ? "bg-orange-500/15 text-orange-400" :
              "bg-green-500/15 text-green-400"
            }`}>
              RDI {race.rdi_score}
            </span>
          )}
        </div>

        {/* Favori */}
        <BookmarkButton entityType="race" entityId={race.id} size="sm" />
      </m.div>
    </Link>
  );
}

// ——— Onglet Courses ———
function RacesTab() {
  const { favorites, isLoading: favsLoading } = useFavorites("race");

  // Fetch les détails des courses favorites
  const raceIds = favorites.map((f) => f.entity_id);
  const { data: races, isLoading: racesLoading } = useQuery<RaceWithCreator[]>({
    queryKey: ["favorite-races", raceIds],
    queryFn: async () => {
      if (raceIds.length === 0) return [];
      const results = await Promise.all(
        raceIds.map(async (id) => {
          const res = await fetch(`/api/races/${id}`);
          if (!res.ok) return null;
          return res.json();
        }),
      );
      return results.filter(Boolean);
    },
    enabled: raceIds.length > 0 && !favsLoading,
  });

  if (favsLoading || racesLoading) return <FavoritesListSkeleton />;

  if (!races || races.length === 0) {
    return (
      <EmptyState
        icon="🏁"
        title="Aucune course favorite"
        description="Ajoute des courses en favoris depuis le calendrier pour les retrouver ici."
        action={{ label: "Voir le calendrier", href: "/races" }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {races.map((race) => (
        <FavoriteRaceRow key={race.id} race={race} />
      ))}
    </div>
  );
}

// ——— Onglet Parcours ———
function RoutesTab() {
  return (
    <EmptyState
      icon="🗺️"
      title="Bientot disponible"
      description="La sauvegarde de parcours arrive bientot. Reste connecte !"
    />
  );
}

// ——— Onglet Profils ———
function ProfilesTab() {
  return (
    <EmptyState
      icon="👤"
      title="Bientot disponible"
      description="Tu pourras bientot suivre tes cyclistes favoris."
    />
  );
}

// ——— Page principale ———
export default function FavoritesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("race");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <div className="w-full max-w-lg">
          <Skeleton className="mb-6 h-12 w-48" />
          <FavoritesListSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <AnimatedPage className="w-full max-w-lg">
        <PageHeader
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          }
          title="Mes favoris"
          subtitle="Tes courses, parcours et profils favoris"
        />

        {/* Tabs */}
        <div className="mb-6 flex gap-1.5 rounded-xl border border-white/[0.06] bg-[#111827]/60 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition ${
                activeTab === tab.key
                  ? "bg-[#6366F1]/15 text-[#818CF8]"
                  : "text-[#64748B] hover:text-[#94A3B8]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu de l'onglet actif */}
        {activeTab === "race" && <RacesTab />}
        {activeTab === "route" && <RoutesTab />}
        {activeTab === "profile" && <ProfilesTab />}
      </AnimatedPage>
    </main>
  );
}
