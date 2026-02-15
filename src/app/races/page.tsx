"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import Skeleton from "@/components/Skeleton";
import { FlagIcon } from "@/components/icons/TabIcons";
import type { RaceWithCreator } from "@/types";

// ——— Federation badge colors ———
const fedColors: Record<string, { bg: string; text: string }> = {
  FFC: { bg: "bg-blue-500/15", text: "text-blue-400" },
  UFOLEP: { bg: "bg-green-500/15", text: "text-green-400" },
  FSGT: { bg: "bg-orange-500/15", text: "text-orange-400" },
  OTHER: { bg: "bg-gray-500/15", text: "text-gray-400" },
};

// ——— Group races by week ———
function groupByWeek(races: RaceWithCreator[]): { label: string; races: RaceWithCreator[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const groups: Map<string, RaceWithCreator[]> = new Map();

  for (const race of races) {
    const raceDate = new Date(race.date);
    const diffDays = Math.floor((raceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let label: string;
    if (diffDays < 0) {
      label = "Passees";
    } else if (diffDays === 0) {
      label = "Aujourd'hui";
    } else if (diffDays === 1) {
      label = "Demain";
    } else if (diffDays <= 3) {
      label = "Ce week-end";
    } else if (diffDays <= 7) {
      label = "Cette semaine";
    } else if (diffDays <= 14) {
      label = "Semaine prochaine";
    } else {
      const monthNames = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];
      label = `${monthNames[raceDate.getMonth()]} ${raceDate.getFullYear()}`;
    }

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(race);
  }

  return Array.from(groups.entries()).map(([label, races]) => ({ label, races }));
}

// ——— Pill filter component ———
function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
        active
          ? "bg-[#6366F1] text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
          : "border border-white/[0.08] text-[#64748B] hover:border-white/[0.15] hover:text-[#94A3B8]"
      }`}
    >
      {label}
    </button>
  );
}

// ——— Race row component ———
function RaceRow({ race }: { race: RaceWithCreator }) {
  const d = new Date(race.date);
  const day = d.getDate();
  const month = d.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase().replace(".", "");
  const fed = fedColors[race.federation] || fedColors.OTHER;

  return (
    <Link href={`/races/${race.id}`}>
      <motion.div
        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-3 transition hover:border-[#6366F1]/20 hover:bg-[#22223A]/60"
        whileTap={{ scale: 0.98 }}
      >
        {/* Date badge */}
        <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-[#6366F1]/10">
          <span className="text-lg font-black leading-none text-white">{day}</span>
          <span className="text-[9px] font-bold text-[#6366F1]">{month}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-bold text-white">{race.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#64748B]">
            <span>{race.location}</span>
            {race.distance_km && <span>· {race.distance_km} km</span>}
            {race.elevation_gain && <span>· D+ {race.elevation_gain}m</span>}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${fed.bg} ${fed.text}`}>
            {race.federation}
          </span>
          {race.category && race.category !== "Seniors" && (
            <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-[#94A3B8]">
              {race.category}
            </span>
          )}
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

        {/* Chevron */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-[#475569]">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </motion.div>
    </Link>
  );
}

// ——— Main Calendar Page ———
export default function RacesCalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [races, setRaces] = useState<RaceWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fedFilter, setFedFilter] = useState<string>("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  const fetchRaces = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fedFilter !== "all") params.set("federation", fedFilter);
      if (catFilter !== "all") params.set("category", catFilter);
      if (genderFilter !== "all") params.set("gender", genderFilter);
      if (search) params.set("search", search);
      params.set("limit", "300");

      const res = await fetch(`/api/races?${params.toString()}`);
      if (res.ok) {
        setRaces(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [fedFilter, catFilter, genderFilter, search]);

  useEffect(() => {
    if (session) fetchRaces();
  }, [session, fetchRaces]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const grouped = useMemo(() => groupByWeek(races), [races]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(races.map(r => r.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [races]);

  if (status === "loading" || !session) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <div className="w-full max-w-2xl">
          <Skeleton className="mb-4 h-8 w-48" />
          <Skeleton className="mb-4 h-10 w-full rounded-xl" />
          <Skeleton className="mb-6 h-8 w-full" />
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="mb-3 h-20 w-full rounded-xl" />)}
        </div>
      </main>
    );
  }

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-2xl">
        <PageHeader
          icon={<FlagIcon size={28} />}
          title="Courses"
          subtitle="Calendrier FFC · UFOLEP · FSGT"
        />

        {/* Search bar */}
        <div className="relative mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher une course..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-[#111827] py-2.5 pl-9 pr-4 text-sm text-white placeholder-[#475569] focus:border-[#6366F1]/50 focus:outline-none"
          />
        </div>

        {/* Federation filters */}
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <FilterPill label="Toutes" active={fedFilter === "all"} onClick={() => setFedFilter("all")} />
          <FilterPill label="FFC" active={fedFilter === "FFC"} onClick={() => setFedFilter("FFC")} />
          <FilterPill label="UFOLEP" active={fedFilter === "UFOLEP"} onClick={() => setFedFilter("UFOLEP")} />
          <FilterPill label="FSGT" active={fedFilter === "FSGT"} onClick={() => setFedFilter("FSGT")} />
        </div>

        {/* Gender & Category filters */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <FilterPill label="H+F" active={genderFilter === "all"} onClick={() => setGenderFilter("all")} />
          <FilterPill label="Hommes" active={genderFilter === "H"} onClick={() => setGenderFilter("H")} />
          <FilterPill label="Femmes" active={genderFilter === "F"} onClick={() => setGenderFilter("F")} />
          {categories.length > 1 && (
            <>
              <div className="w-px flex-shrink-0 bg-white/[0.06]" />
              <FilterPill label="Toutes cat." active={catFilter === "all"} onClick={() => setCatFilter("all")} />
              {categories.slice(0, 6).map(cat => (
                <FilterPill key={cat} label={cat} active={catFilter === cat} onClick={() => setCatFilter(cat)} />
              ))}
            </>
          )}
        </div>

        <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* Race count */}
        {!loading && (
          <p className="mb-4 text-xs text-[#64748B]">
            {races.length} course{races.length !== 1 ? "s" : ""} trouvee{races.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Races grouped by week */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : races.length === 0 ? (
          <EmptyState
            icon={<FlagIcon size={48} />}
            title="Aucune course"
            description="Aucune course trouvee avec ces filtres."
          />
        ) : (
          <div className="flex flex-col gap-6">
            {grouped.map((group) => (
              <div key={group.label}>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#64748B]">
                  {group.label}
                </h3>
                <div className="flex flex-col gap-2">
                  {group.races.map((race) => (
                    <RaceRow key={race.id} race={race} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Propose a race */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#475569] mb-2">Tu ne trouves pas ta course ?</p>
          <Link
            href="/races/create"
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-4 py-2 text-xs font-semibold text-[#94A3B8] transition hover:border-[#6366F1]/30 hover:text-white"
          >
            + Proposer une course
          </Link>
        </div>
      </div>
    </AnimatedPage>
  );
}
