"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import AnimatedPage from "@/components/AnimatedPage";
import Skeleton from "@/components/Skeleton";
import PageHeader from "@/components/PageHeader";
import { SwordsIcon } from "@/components/icons/TabIcons";
import type { CardTier } from "@/types";
import { tierConfig, tierBorderColors } from "@/components/VeloCard";
import { Avatar } from "@/components/Avatar";

// ——— Types ———
interface CompareUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
  region: string | null;
  club_name: string | null;
  pac: number;
  end: number;
  mon: number;
  res: number;
  spr: number;
  val: number;
  ovr: number;
  tier: CardTier;
  special_card: string | null;
  active_weeks_streak: number;
}

interface SearchResult {
  user_id: string;
  username: string;
  avatar_url: string | null;
  ovr: number;
  tier: CardTier;
}

const STAT_LABELS: { key: keyof Pick<CompareUser, "pac" | "end" | "mon" | "res" | "spr" | "val">; label: string; icon: string }[] = [
  { key: "pac", label: "Vitesse", icon: "⚡" },
  { key: "mon", label: "Montagne", icon: "⛰️" },
  { key: "end", label: "Endurance", icon: "🔋" },
  { key: "res", label: "Puissance", icon: "💪" },
  { key: "spr", label: "Sprint", icon: "🏃" },
  { key: "val", label: "Technique", icon: "🎯" },
];

const tierAccentHex: Record<CardTier, string> = {
  bronze: "#E8A854",
  argent: "#B8A0D8",
  platine: "#E0E8F0",
  diamant: "#00D4FF",
  legende: "#FFD700",
};

export default function ComparePage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <div className="w-full max-w-2xl">
          <Skeleton className="mb-4 h-8 w-48" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </main>
    }>
      <CompareContent />
    </Suspense>
  );
}

function CompareContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParamsHook = useSearchParams();

  // Search states for both slots
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  const [results1, setResults1] = useState<SearchResult[]>([]);
  const [results2, setResults2] = useState<SearchResult[]>([]);
  const [searching1, setSearching1] = useState(false);
  const [searching2, setSearching2] = useState(false);

  const [selected1, setSelected1] = useState<SearchResult | null>(null);
  const [selected2, setSelected2] = useState<SearchResult | null>(null);

  const [compareData, setCompareData] = useState<{ user1: CompareUser; user2: CompareUser } | null>(null);
  const [loading, setLoading] = useState(false);

  const debounce1 = useRef<NodeJS.Timeout>(null);
  const debounce2 = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // Auto-load if URL params provided
  useEffect(() => {
    const u1 = searchParamsHook.get("user1");
    const u2 = searchParamsHook.get("user2");
    if (u1 && u2) {
      setSelected1({ user_id: u1, username: "", avatar_url: null, ovr: 0, tier: "bronze" });
      setSelected2({ user_id: u2, username: "", avatar_url: null, ovr: 0, tier: "bronze" });
    }
  }, [searchParamsHook]);

  // Search function
  const doSearch = useCallback(async (query: string, slot: 1 | 2) => {
    if (query.length < 2) {
      slot === 1 ? setResults1([]) : setResults2([]);
      return;
    }
    slot === 1 ? setSearching1(true) : setSearching2(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        slot === 1 ? setResults1(data) : setResults2(data);
      }
    } finally {
      slot === 1 ? setSearching1(false) : setSearching2(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounce1.current) clearTimeout(debounce1.current);
    debounce1.current = setTimeout(() => doSearch(search1, 1), 300);
    return () => { if (debounce1.current) clearTimeout(debounce1.current); };
  }, [search1, doSearch]);

  useEffect(() => {
    if (debounce2.current) clearTimeout(debounce2.current);
    debounce2.current = setTimeout(() => doSearch(search2, 2), 300);
    return () => { if (debounce2.current) clearTimeout(debounce2.current); };
  }, [search2, doSearch]);

  // Fetch comparison when both selected
  useEffect(() => {
    if (!selected1 || !selected2) return;
    setLoading(true);
    fetch(`/api/compare?user1=${selected1.user_id}&user2=${selected2.user_id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.user1 && data.user2) {
          setCompareData(data);
          // Update selected names from API response
          setSelected1((prev) => prev ? { ...prev, username: data.user1.username, avatar_url: data.user1.avatar_url, ovr: data.user1.ovr, tier: data.user1.tier } : prev);
          setSelected2((prev) => prev ? { ...prev, username: data.user2.username, avatar_url: data.user2.avatar_url, ovr: data.user2.ovr, tier: data.user2.tier } : prev);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selected1?.user_id, selected2?.user_id]);

  if (status === "loading" || !session) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <div className="w-full max-w-2xl">
          <Skeleton className="mb-4 h-8 w-48" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-2xl">
        <PageHeader
          icon={<SwordsIcon size={28} />}
          title="Comparer"
          subtitle="Confronte deux coureurs stat par stat"
        />

        {/* ═══ Player Selection ═══ */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Player 1 */}
          <PlayerSlot
            label="Coureur 1"
            selected={selected1}
            search={search1}
            setSearch={setSearch1}
            results={results1}
            searching={searching1}
            onSelect={(r) => { setSelected1(r); setSearch1(""); setResults1([]); }}
            onClear={() => { setSelected1(null); setCompareData(null); }}
            accent={selected1 ? tierAccentHex[selected1.tier] : "#6366F1"}
          />

          {/* VS divider */}
          <PlayerSlot
            label="Coureur 2"
            selected={selected2}
            search={search2}
            setSearch={setSearch2}
            results={results2}
            searching={searching2}
            onSelect={(r) => { setSelected2(r); setSearch2(""); setResults2([]); }}
            onClear={() => { setSelected2(null); setCompareData(null); }}
            accent={selected2 ? tierAccentHex[selected2.tier] : "#6366F1"}
          />
        </div>

        {/* ═══ VS Badge ═══ */}
        {selected1 && selected2 && (
          <div className="flex justify-center mb-6">
            <div className="rounded-full border border-white/[0.1] bg-[#1A1A2E] px-4 py-1.5">
              <span className="text-xs font-black tracking-widest text-[#6366F1]">VS</span>
            </div>
          </div>
        )}

        {/* ═══ Loading ═══ */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
          </div>
        )}

        {/* ═══ Comparison Results ═══ */}
        {compareData && !loading && (
          <div className="flex flex-col gap-3">
            {/* OVR comparison */}
            <m.div
              className="rounded-2xl border border-white/[0.06] bg-[#1A1A2E]/60 p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-3xl font-black" style={{ color: tierAccentHex[compareData.user1.tier] }}>
                    {compareData.user1.ovr}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">OVR</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04]">
                  <span className="text-xs font-black text-[#475569]">VS</span>
                </div>
                <div className="text-center flex-1">
                  <p className="text-3xl font-black" style={{ color: tierAccentHex[compareData.user2.tier] }}>
                    {compareData.user2.ovr}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">OVR</p>
                </div>
              </div>
            </m.div>

            {/* Stat-by-stat comparison */}
            {STAT_LABELS.map((stat, i) => {
              const v1 = compareData.user1[stat.key];
              const v2 = compareData.user2[stat.key];
              const maxVal = Math.max(v1, v2, 1);
              const winner = v1 > v2 ? 1 : v2 > v1 ? 2 : 0;

              return (
                <m.div
                  key={stat.key}
                  className="rounded-xl border border-white/[0.06] bg-[#1A1A2E]/40 p-3"
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-center gap-3">
                    {/* Left value */}
                    <div className="w-12 text-right">
                      <span className={`text-sm font-black ${winner === 1 ? "text-[#22C55E]" : winner === 2 ? "text-red-400" : "text-white"}`}>
                        {v1}
                      </span>
                    </div>

                    {/* Bars */}
                    <div className="flex-1">
                      <div className="mb-1 flex justify-center">
                        <span className="text-[10px] font-bold text-[#64748B]">
                          {stat.icon} {stat.label}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {/* Left bar (grows from right) */}
                        <div className="flex h-2 flex-1 justify-end overflow-hidden rounded-full bg-white/[0.04]">
                          <m.div
                            className="h-full rounded-full"
                            style={{
                              background: winner === 1 ? "#22C55E" : winner === 0 ? "#94A3B8" : "#475569",
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(v1 / maxVal) * 100}%` }}
                            transition={{ delay: i * 0.05 + 0.2, duration: 0.5 }}
                          />
                        </div>
                        {/* Right bar (grows from left) */}
                        <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                          <m.div
                            className="h-full rounded-full"
                            style={{
                              background: winner === 2 ? "#22C55E" : winner === 0 ? "#94A3B8" : "#475569",
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(v2 / maxVal) * 100}%` }}
                            transition={{ delay: i * 0.05 + 0.2, duration: 0.5 }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right value */}
                    <div className="w-12 text-left">
                      <span className={`text-sm font-black ${winner === 2 ? "text-[#22C55E]" : winner === 1 ? "text-red-400" : "text-white"}`}>
                        {v2}
                      </span>
                    </div>
                  </div>
                </m.div>
              );
            })}

            {/* Summary */}
            {(() => {
              let wins1 = 0, wins2 = 0;
              for (const stat of STAT_LABELS) {
                const v1 = compareData.user1[stat.key];
                const v2 = compareData.user2[stat.key];
                if (v1 > v2) wins1++;
                else if (v2 > v1) wins2++;
              }
              return (
                <m.div
                  className="rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-4 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-xs text-[#64748B] mb-2">Stats remportées</p>
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-2xl font-black text-[#22C55E]">{wins1}</span>
                    <span className="text-sm text-[#475569]">-</span>
                    <span className="text-2xl font-black text-[#22C55E]">{wins2}</span>
                  </div>
                  <p className="mt-2 text-[10px] text-[#475569]">
                    {wins1 > wins2
                      ? `${compareData.user1.username} domine !`
                      : wins2 > wins1
                        ? `${compareData.user2.username} domine !`
                        : "Égalité parfaite !"
                    }
                  </p>
                </m.div>
              );
            })()}

            {/* Duel CTA */}
            <Link
              href={`/duels?opponent=${compareData.user2.user_id}`}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#6366F1] py-3 text-sm font-bold text-white transition hover:bg-[#6366F1]/80 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
            >
              <SwordsIcon size={16} />
              Défier en duel
            </Link>
          </div>
        )}

        {/* ═══ Empty state ═══ */}
        {!selected1 && !selected2 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-[#475569]">
              Recherche deux coureurs pour comparer leurs stats
            </p>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}

// ——— Player Slot Component ———
function PlayerSlot({
  label,
  selected,
  search,
  setSearch,
  results,
  searching,
  onSelect,
  onClear,
  accent,
}: {
  label: string;
  selected: SearchResult | null;
  search: string;
  setSearch: (v: string) => void;
  results: SearchResult[];
  searching: boolean;
  onSelect: (r: SearchResult) => void;
  onClear: () => void;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">{label}</p>

      {selected ? (
        <div
          className="relative rounded-xl border p-3 text-center"
          style={{ borderColor: `${accent}30`, background: `${accent}08` }}
        >
          <button
            onClick={onClear}
            aria-label="Retirer le joueur"
            className="absolute right-2 top-2 text-[#475569] hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <Avatar src={selected.avatar_url} alt={selected.username || ""} size={48} className="mx-auto border-2" style={{ borderColor: accent }} />
          <p className="mt-2 truncate text-sm font-bold text-white">{selected.username || "..."}</p>
          <p className="text-lg font-black" style={{ color: accent }}>{selected.ovr}</p>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher..."
            aria-label="Rechercher un cycliste"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-[#111827] py-2.5 px-3 text-sm text-white placeholder-[#475569] focus:border-[#6366F1]/50 focus:outline-none"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div role="status" aria-label="Recherche en cours" className="h-4 w-4 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent" />
            </div>
          )}

          {/* Dropdown results */}
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0F1629] shadow-xl">
              {results.map((r) => (
                <button
                  key={r.user_id}
                  onClick={() => onSelect(r)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.04] transition"
                >
                  <Avatar src={r.avatar_url} alt={r.username || ""} size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-bold text-white">{r.username}</p>
                  </div>
                  <span className="text-xs font-black" style={{ color: tierAccentHex[r.tier] }}>
                    {r.ovr}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
