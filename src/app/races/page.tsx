"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import Skeleton from "@/components/Skeleton";
import { FlagIcon } from "@/components/icons/TabIcons";
import { useRaces } from "@/hooks/useRaces";
import type { RaceWithCreator } from "@/types";

// ——— Federation badge colors ———
const fedColors: Record<string, { bg: string; text: string }> = {
  FFC: { bg: "bg-blue-500/15", text: "text-blue-400" },
  UFOLEP: { bg: "bg-green-500/15", text: "text-green-400" },
  FSGT: { bg: "bg-orange-500/15", text: "text-orange-400" },
  OTHER: { bg: "bg-gray-500/15", text: "text-gray-400" },
};

// ——— Category groups (includes legacy DB names as aliases) ———
const CATEGORY_GROUPS: Record<string, string[]> = {
  "Élite": ["Élite", "Seniors"],
  "Open": ["Open 1", "Open 2", "Open 3", "Pass Open"],
  "Access": ["Access 1", "Access 2", "Access 3", "Access 4"],
  "Junior": ["Junior", "Juniors"],
  "Cadet": ["Cadet", "Cadets"],
};
const CATEGORY_GROUP_KEYS = Object.keys(CATEGORY_GROUPS);

// ——— Regions (short label → API value) ———
const REGIONS: { label: string; value: string }[] = [
  { label: "Occitanie", value: "Occitanie" },
  { label: "PACA", value: "Provence-Alpes-Côte d'Azur" },
  { label: "Île-de-France", value: "Île-de-France" },
  { label: "Auvergne-RA", value: "Auvergne-Rhône-Alpes" },
  { label: "Nouvelle-Aquit.", value: "Nouvelle-Aquitaine" },
  { label: "Bretagne", value: "Bretagne" },
  { label: "Normandie", value: "Normandie" },
  { label: "Grand Est", value: "Grand Est" },
  { label: "Hauts-de-France", value: "Hauts-de-France" },
  { label: "Pays de la Loire", value: "Pays de la Loire" },
  { label: "Centre-VdL", value: "Centre-Val de Loire" },
  { label: "Bourgogne-FC", value: "Bourgogne-Franche-Comté" },
  { label: "Corse", value: "Corse" },
];

// ——— Check if a date is today ———
function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}


// ——— Group races by week (only upcoming + today) ———
function groupByWeek(races: RaceWithCreator[]): { label: string; races: RaceWithCreator[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const groups: Map<string, RaceWithCreator[]> = new Map();

  for (const race of races) {
    const raceDate = new Date(race.date);
    const diffDays = Math.floor((raceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let label: string;
    if (diffDays < 0) continue; // Skip past races
    if (diffDays === 0) {
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
      const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
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
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
        active
          ? "bg-[#6366F1] text-white shadow-[0_0_10px_rgba(99,102,241,0.25)]"
          : "text-[#64748B] hover:text-[#94A3B8]"
      }`}
    >
      {label}
    </button>
  );
}

// ——— Filter row ———
function FilterRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-none">
      {children}
    </div>
  );
}

// ——— Region dropdown ———
function RegionDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const activeLabel = value === "all"
    ? "Toutes régions"
    : REGIONS.find(r => r.value === value)?.label ?? value;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
          value !== "all"
            ? "bg-[#6366F1] text-white shadow-[0_0_10px_rgba(99,102,241,0.25)]"
            : "text-[#64748B] hover:text-[#94A3B8]"
        }`}
      >
        {activeLabel}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-white/[0.08] bg-[#111827] py-1 shadow-2xl max-h-64 overflow-y-auto scrollbar-none"
          >
            <button
              onClick={() => { onChange("all"); setOpen(false); }}
              className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                value === "all" ? "bg-[#6366F1]/10 text-[#818CF8]" : "text-[#94A3B8] hover:bg-white/[0.04]"
              }`}
            >
              Toutes régions
            </button>
            {REGIONS.map(r => (
              <button
                key={r.value}
                onClick={() => { onChange(r.value); setOpen(false); }}
                className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                  value === r.value ? "bg-[#6366F1]/10 text-[#818CF8]" : "text-[#94A3B8] hover:bg-white/[0.04]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ——— Race row component ———
function RaceRow({ race, isPast }: { race: RaceWithCreator; isPast?: boolean }) {
  const d = new Date(race.date);
  const day = d.getDate();
  const month = d.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase().replace(".", "");
  const fed = fedColors[race.federation] || fedColors.OTHER;
  const today = isToday(race.date);

  return (
    <Link href={`/races/${race.id}`}>
      <m.div
        className={`flex items-center gap-3 rounded-xl border p-3 transition ${
          isPast
            ? "border-white/[0.04] bg-[#1A1A2E]/30 opacity-50"
            : today
            ? "border-l-[3px] border-l-[#6366F1] border-t-white/[0.06] border-r-white/[0.06] border-b-white/[0.06] bg-[#6366F1]/[0.03]"
            : "border-white/[0.06] bg-[#1A1A2E]/60 hover:border-[#6366F1]/20 hover:bg-[#22223A]/60"
        }`}
        whileTap={{ scale: 0.98 }}
      >
        {/* Date badge */}
        <div className={`flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg ${
          today ? "bg-[#6366F1]/20" : "bg-[#6366F1]/10"
        }`}>
          <span className="text-lg font-black leading-none text-white">{day}</span>
          <span className={`text-[9px] font-bold ${today ? "text-[#818CF8]" : "text-[#6366F1]"}`}>{month}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-bold text-white">{race.name}</p>
            {today && (
              <span className="shrink-0 rounded-md bg-[#6366F1]/20 px-1.5 py-0.5 text-[9px] font-black text-[#818CF8]">
                AUJOURD&apos;HUI
              </span>
            )}
            {isPast && (
              <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-white/30">
                Terminée
              </span>
            )}
          </div>
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
          {race.category && (
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
        {!isPast && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-[#475569]">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
      </m.div>
    </Link>
  );
}

// ——— Main Calendar Page ———
export default function RacesCalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [fedFilter, setFedFilter] = useState<string>("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // Build filters for the hook — upcoming only (server-side filter)
  const raceFilters = useMemo(() => {
    const filters: Record<string, string> = { limit: "200" };
    if (fedFilter !== "all") filters.federation = fedFilter;
    if (genderFilter !== "all") filters.gender = genderFilter;
    if (regionFilter !== "all") filters.region = regionFilter;
    if (search) filters.search = search;
    return filters;
  }, [fedFilter, genderFilter, regionFilter, search]);

  // Build filters for past races (loaded separately on toggle)
  const pastFilters = useMemo(() => {
    const filters: Record<string, string> = { limit: "100", upcoming: "false", past_only: "true" };
    if (fedFilter !== "all") filters.federation = fedFilter;
    if (genderFilter !== "all") filters.gender = genderFilter;
    if (regionFilter !== "all") filters.region = regionFilter;
    if (search) filters.search = search;
    return filters;
  }, [fedFilter, genderFilter, regionFilter, search]);

  // Fetch upcoming races (server-side filter: date >= today)
  const { data: allRaces = [], isLoading: loading } = useRaces(raceFilters, status === "authenticated");

  // Fetch past races only when toggle is open
  const { data: pastRacesData = [], isLoading: loadingPast } = useRaces(pastFilters, status === "authenticated" && showPast);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Apply category GROUP filter client-side so the pills stay visible
  const upcomingRaces = useMemo(() => {
    if (catFilter === "all") return allRaces;
    const allowed = CATEGORY_GROUPS[catFilter];
    if (!allowed) return allRaces;
    return allRaces.filter(r => allowed.includes(r.category));
  }, [allRaces, catFilter]);

  // Past races (server-filtered, lazy-loaded)
  const pastRaces = useMemo(() => {
    if (catFilter === "all") return pastRacesData;
    const allowed = CATEGORY_GROUPS[catFilter];
    if (!allowed) return pastRacesData;
    return pastRacesData.filter(r => allowed.includes(r.category));
  }, [pastRacesData, catFilter]);

  const grouped = useMemo(() => groupByWeek(upcomingRaces), [upcomingRaces]);

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

        {/* Filters */}
        <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 flex flex-col gap-1.5">
          {/* Row 1: Fédération + Genre */}
          <div className="flex items-center gap-1">
            <FilterRow>
              <FilterPill label="Tout" active={fedFilter === "all"} onClick={() => setFedFilter("all")} />
              <FilterPill label="FFC" active={fedFilter === "FFC"} onClick={() => setFedFilter("FFC")} />
              <FilterPill label="UFOLEP" active={fedFilter === "UFOLEP"} onClick={() => setFedFilter("UFOLEP")} />
              <FilterPill label="FSGT" active={fedFilter === "FSGT"} onClick={() => setFedFilter("FSGT")} />
            </FilterRow>
            <div className="h-4 w-px flex-shrink-0 bg-white/[0.08]" />
            <FilterRow>
              <FilterPill label="H+F" active={genderFilter === "all"} onClick={() => setGenderFilter("all")} />
              <FilterPill label="Hommes" active={genderFilter === "H"} onClick={() => setGenderFilter("H")} />
              <FilterPill label="Femmes" active={genderFilter === "F"} onClick={() => setGenderFilter("F")} />
            </FilterRow>
          </div>

          {/* Row 2: Catégorie */}
          <FilterRow>
            <FilterPill label="Tout" active={catFilter === "all"} onClick={() => setCatFilter("all")} />
            {CATEGORY_GROUP_KEYS.map(group => (
              <FilterPill key={group} label={group} active={catFilter === group} onClick={() => setCatFilter(group)} />
            ))}
          </FilterRow>

          {/* Row 3: Région dropdown */}
          <RegionDropdown value={regionFilter} onChange={setRegionFilter} />
        </div>

        {/* Race count */}
        {!loading && (
          <p className="mb-4 text-xs text-[#64748B]">
            {upcomingRaces.length} course{upcomingRaces.length !== 1 ? "s" : ""} à venir
          </p>
        )}

        {/* Races grouped by week */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : upcomingRaces.length === 0 && !showPast ? (
          <EmptyState
            icon={<FlagIcon size={48} />}
            title="Aucune course à venir"
            description="Aucune course trouvée avec ces filtres."
          />
        ) : (
          <div className="flex flex-col gap-6">
            {/* Upcoming races */}
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

            {/* Past races toggle */}
            <div className="mt-2">
              <button
                onClick={() => setShowPast(!showPast)}
                className="w-full py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/40 text-sm font-medium active:bg-white/[0.04] transition-colors flex items-center justify-center gap-2"
              >
                {showPast ? "Masquer" : "Voir"} les courses passées
                {showPast && pastRaces.length > 0 && ` (${pastRaces.length})`}
                <span className={`transform transition-transform ${showPast ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              {showPast && (
                <m.div
                  className="mt-3 flex flex-col gap-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                >
                  {loadingPast ? (
                    <div className="flex flex-col gap-2">
                      {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                    </div>
                  ) : pastRaces.length === 0 ? (
                    <p className="py-4 text-center text-xs text-white/20">
                      Aucune course passée trouvée.
                    </p>
                  ) : (
                    pastRaces.map((race) => (
                      <RaceRow key={race.id} race={race} isPast={true} />
                    ))
                  )}
                </m.div>
              )}
            </div>
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
