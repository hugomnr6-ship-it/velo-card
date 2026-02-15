"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedPage from "@/components/AnimatedPage";
import ErrorState from "@/components/ErrorState";
import { useToast } from "@/contexts/ToastContext";
import type { CardTier, DuelCategory, DuelWithPlayers } from "@/types";
import { DUEL_CATEGORY_LABELS } from "@/types";
import { tierConfig, tierBorderColors } from "@/components/VeloCard";
import { IconSwords, IconStar, IconLightning, IconMountain, IconTarget, IconWind, IconMuscle, IconFire, IconCycling, IconCalendar, STAT_ICONS } from "@/components/icons/VeloIcons";

/* ═══ Constants ═══ */

const tierAccentHex: Record<CardTier, string> = {
  bronze: "#cd7f32", argent: "#B8A0D8", platine: "#E0E8F0", diamant: "#00D4FF", legende: "#FFD700",
};

interface SearchResult {
  user_id: string;
  username: string;
  avatar_url: string | null;
  ovr: number;
  tier: CardTier;
}

interface DuelStatsData {
  wins: number;
  losses: number;
  draws: number;
  ego_points: number;
  pending_received: number;
}

/* ═══ Main Page ═══ */

export default function DuelsPage() {
  const router = useRouter();
  const { status } = useSession();
  const { toast } = useToast();
  const [duels, setDuels] = useState<(DuelWithPlayers & { is_mine: boolean })[]>([]);
  const [stats, setStats] = useState<DuelStatsData | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "history">("pending");

  // Create duel state
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<SearchResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DuelCategory>("ovr");
  const [selectedStake, setSelectedStake] = useState(10);
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // Fetch duels & stats
  const fetchDuels = useCallback(async () => {
    try {
      setError(null);
      const [duelsRes, statsRes] = await Promise.all([
        fetch("/api/duels"),
        fetch("/api/duels/stats"),
      ]);
      const duelsData = await duelsRes.json();
      const statsData = await statsRes.json();
      setDuels(duelsData.duels || []);
      setUserId(duelsData.user_id || "");
      setStats(statsData);
    } catch {
      setError("Impossible de charger les duels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchDuels();
  }, [status, fetchDuels]);

  // Search opponents
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data.filter((u: SearchResult) => u.user_id !== userId) : []);
    } catch { setSearchResults([]); }
    finally { setSearchLoading(false); }
  }, [userId]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(searchQuery), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, doSearch]);

  // Create duel
  const createDuel = async () => {
    if (!selectedOpponent) return;
    setCreating(true);
    try {
      const res = await fetch("/api/duels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opponent_id: selectedOpponent.user_id,
          category: selectedCategory,
          duel_type: "instant",
          stake: selectedStake,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la creation du defi");
      }
      toast("Defi envoye !", "success");
      setShowCreate(false);
      setSelectedOpponent(null);
      setSearchQuery("");
      fetchDuels();
    } catch (err: any) {
      toast(err.message || "Erreur reseau", "error");
    } finally {
      setCreating(false);
    }
  };

  // Accept / Decline
  const handleAccept = async (duelId: string) => {
    try {
      const res = await fetch(`/api/duels/${duelId}/accept`, { method: "POST" });
      if (!res.ok) throw new Error("Erreur lors de l'acceptation");
      toast("Defi accepte !", "success");
      fetchDuels();
    } catch (err: any) {
      toast(err.message || "Erreur reseau", "error");
    }
  };

  const handleDecline = async (duelId: string) => {
    try {
      const res = await fetch(`/api/duels/${duelId}/decline`, { method: "POST" });
      if (!res.ok) throw new Error("Erreur lors du refus");
      toast("Defi refuse", "info");
      fetchDuels();
    } catch (err: any) {
      toast(err.message || "Erreur reseau", "error");
    }
  };

  // Filter duels by tab
  const filteredDuels = duels.filter((d) => {
    if (activeTab === "pending") return d.status === "pending";
    if (activeTab === "active") return d.status === "accepted";
    return d.status === "resolved" || d.status === "declined" || d.status === "expired";
  });

  const pendingCount = duels.filter(d => d.status === "pending" && d.opponent_id === userId).length;

  if (status === "loading" || loading) {
    return (
      <main className="flex min-h-screen flex-col items-center gap-4 px-4 pb-24 pt-12">
        <div className="h-20 w-full max-w-md animate-pulse rounded-2xl bg-white/5" />
        <div className="h-12 w-full max-w-md animate-pulse rounded-xl bg-white/5" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 w-full max-w-md animate-pulse rounded-xl bg-white/5" />
        ))}
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <ErrorState message={error} onRetry={fetchDuels} />
      </main>
    );
  }

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      {/* ═══ Header + Stats ═══ */}
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-black tracking-wider text-white font-['Space_Grotesk']">
            <IconSwords size={22} className="text-[#6366F1] inline-block mr-2" />Duels
          </h1>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-full bg-[#6366F1] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#5557E0] active:scale-95"
          >
            + Défier
          </button>
        </div>

        {/* Ego stats bar */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-4 mb-4"
          >
            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col items-center">
                <span className="text-lg font-black text-emerald-400 font-['JetBrains_Mono']">{stats.wins}</span>
                <span className="text-[8px] font-bold tracking-wider text-white/30">VICTOIRES</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-black text-red-400 font-['JetBrains_Mono']">{stats.losses}</span>
                <span className="text-[8px] font-bold tracking-wider text-white/30">DÉFAITES</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-black text-white/50 font-['JetBrains_Mono']">{stats.draws}</span>
                <span className="text-[8px] font-bold tracking-wider text-white/30">NULS</span>
              </div>
              <div className="flex flex-col items-center">
                <span className={`text-lg font-black font-['JetBrains_Mono'] ${stats.ego_points >= 0 ? "text-[#FFD700]" : "text-red-400"}`}>
                  {stats.ego_points >= 0 ? "+" : ""}{stats.ego_points}
                </span>
                <span className="text-[8px] font-bold tracking-wider text-white/30">EGO PTS</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex glass rounded-xl p-1 mb-4">
          {([
            { key: "pending" as const, label: "En attente", count: pendingCount },
            { key: "active" as const, label: "En cours", count: 0 },
            { key: "history" as const, label: "Historique", count: 0 },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex-1 rounded-lg py-2 text-xs font-bold transition ${
                activeTab === tab.key ? "text-white" : "text-white/30 hover:text-white/50"
              }`}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="duel-tab"
                  className="absolute inset-0 rounded-lg bg-[#6366F1]/15 border border-[#6366F1]/25"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative">
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Duel list */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3"
          >
            {filteredDuels.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-3xl mb-2 flex justify-center">
                  <IconSwords size={28} className="text-white/20" />
                </p>
                <p className="text-sm text-white/30">
                  {activeTab === "pending" ? "Aucun défi en attente" : activeTab === "active" ? "Aucun duel en cours" : "Pas encore d'historique"}
                </p>
                {activeTab === "pending" && (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="mt-3 text-xs font-bold text-[#6366F1] hover:text-[#818CF8] transition"
                  >
                    Lance ton premier défi →
                  </button>
                )}
              </div>
            )}

            {filteredDuels.map((duel, i) => (
              <DuelCard
                key={duel.id}
                duel={duel}
                userId={userId}
                index={i}
                onAccept={() => handleAccept(duel.id)}
                onDecline={() => handleDecline(duel.id)}
                onViewProfile={(id) => router.push(`/profile/${id}`)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══ Create Duel Overlay ═══ */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="w-full max-w-md rounded-t-3xl border-t border-white/[0.08] bg-[#0B1120] p-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-white">Nouveau Défi</h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="text-white/30 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              {/* Step 1: Choose opponent */}
              {!selectedOpponent ? (
                <>
                  <p className="text-xs text-white/40 mb-3">Choisis ton adversaire</p>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un pseudo..."
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 px-4 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#6366F1]/50 transition"
                    autoFocus
                  />
                  <div className="mt-3 flex flex-col gap-2 max-h-[40vh] overflow-y-auto">
                    {searchLoading && <p className="py-4 text-center text-xs text-white/30">Recherche...</p>}
                    {searchResults.map((user) => (
                      <button
                        key={user.user_id}
                        onClick={() => { setSelectedOpponent(user); setSearchQuery(""); }}
                        className={`rounded-xl border ${tierBorderColors[user.tier]} bg-gradient-to-r ${tierConfig[user.tier].bg} p-3 text-left transition hover:scale-[1.01]`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full overflow-hidden border border-white/10">
                            {user.avatar_url ? (
                              <img src={`/api/img?url=${encodeURIComponent(user.avatar_url)}`} alt="" className="h-full w-full object-cover" />
                            ) : <div className="h-full w-full bg-white/10" />}
                          </div>
                          <span className="text-sm font-bold text-white flex-1">{user.username}</span>
                          <span className="text-lg font-black font-['JetBrains_Mono']" style={{ color: tierAccentHex[user.tier] }}>
                            {user.ovr}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* Selected opponent preview */}
                  <div className="flex items-center gap-3 rounded-xl border border-[#6366F1]/25 bg-[#6366F1]/[0.08] p-3 mb-4">
                    <div className="h-10 w-10 rounded-full overflow-hidden border-2" style={{ borderColor: tierAccentHex[selectedOpponent.tier] }}>
                      {selectedOpponent.avatar_url ? (
                        <img src={`/api/img?url=${encodeURIComponent(selectedOpponent.avatar_url)}`} alt="" className="h-full w-full object-cover" />
                      ) : <div className="h-full w-full bg-white/10" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{selectedOpponent.username}</p>
                      <p className="text-[10px]" style={{ color: tierAccentHex[selectedOpponent.tier] }}>
                        {tierConfig[selectedOpponent.tier].label} · OVR {selectedOpponent.ovr}
                      </p>
                    </div>
                    <button onClick={() => setSelectedOpponent(null)} className="text-xs text-white/30 hover:text-white">
                      Changer
                    </button>
                  </div>

                  {/* Step 2: Choose category */}
                  <p className="text-xs text-white/40 mb-2">Catégorie du défi</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {(Object.entries(DUEL_CATEGORY_LABELS) as [DuelCategory, { label: string; emoji: string; short: string }][])
                      .filter(([key]) => !key.startsWith("weekly_"))
                      .map(([key, info]) => {
                        const CatIcon = STAT_ICONS[key];
                        return (
                        <button
                          key={key}
                          onClick={() => setSelectedCategory(key)}
                          className={`rounded-lg border p-2.5 text-center transition ${
                            selectedCategory === key
                              ? "border-[#6366F1]/50 bg-[#6366F1]/15"
                              : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05]"
                          }`}
                        >
                          <span className="flex justify-center">{CatIcon ? <CatIcon size={18} className="text-white/60" /> : null}</span>
                          <p className="text-[10px] font-bold text-white/60 mt-0.5">{info.short}</p>
                        </button>
                        );
                      })}
                  </div>

                  {/* Step 3: Choose stake */}
                  <p className="text-xs text-white/40 mb-2">Mise (points d'ego)</p>
                  <div className="flex gap-2 mb-6">
                    {[5, 10, 25, 50].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedStake(s)}
                        className={`flex-1 rounded-lg border py-2 text-sm font-bold transition ${
                          selectedStake === s
                            ? "border-[#FFD700]/50 bg-[#FFD700]/10 text-[#FFD700]"
                            : "border-white/[0.06] bg-white/[0.03] text-white/40 hover:text-white/60"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Submit */}
                  <button
                    onClick={createDuel}
                    disabled={creating}
                    className="w-full rounded-xl bg-[#6366F1] py-3.5 text-sm font-bold text-white transition hover:bg-[#5557E0] active:scale-[0.98] disabled:opacity-50"
                  >
                    {creating ? "Envoi..." : `Lancer le défi (${selectedStake} pts)`}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}

/* ═══ Duel Card Component ═══ */

function DuelCard({
  duel,
  userId,
  index,
  onAccept,
  onDecline,
  onViewProfile,
}: {
  duel: DuelWithPlayers & { is_mine: boolean };
  userId: string;
  index: number;
  onAccept: () => void;
  onDecline: () => void;
  onViewProfile: (id: string) => void;
}) {
  const catInfo = DUEL_CATEGORY_LABELS[duel.category as DuelCategory];
  const isReceived = duel.opponent_id === userId && duel.status === "pending";
  const iWon = duel.winner_id === userId;
  const isDraw = duel.is_draw;
  const isResolved = duel.status === "resolved";

  const me = duel.challenger_id === userId ? duel.challenger : duel.opponent;
  const them = duel.challenger_id === userId ? duel.opponent : duel.challenger;
  const myValue = duel.challenger_id === userId ? duel.challenger_value : duel.opponent_value;
  const theirValue = duel.challenger_id === userId ? duel.opponent_value : duel.challenger_value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass rounded-xl overflow-hidden ${
        isResolved
          ? iWon
            ? "!border-emerald-500/20"
            : isDraw
              ? "!border-white/10"
              : "!border-red-500/15"
          : ""
      }`}
    >
      {/* Top: VS bar */}
      <div className="flex items-center px-4 py-3">
        {/* Me */}
        <button
          onClick={() => onViewProfile(duel.challenger_id === userId ? duel.challenger_id : duel.opponent_id)}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden border" style={{ borderColor: `${tierAccentHex[me.tier]}50` }}>
            {me.avatar_url ? (
              <img src={`/api/img?url=${encodeURIComponent(me.avatar_url)}`} alt="" className="h-full w-full object-cover" />
            ) : <div className="h-full w-full bg-white/10" />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">{me.username}</p>
            <p className="text-[9px]" style={{ color: tierAccentHex[me.tier] }}>{me.ovr}</p>
          </div>
        </button>

        {/* VS / Result */}
        <div className="flex flex-col items-center px-3">
          {isResolved ? (
            <>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-black font-['JetBrains_Mono'] ${myValue !== null && theirValue !== null && myValue > theirValue ? "text-emerald-400" : "text-white/40"}`}>
                  {myValue !== null ? Math.round(myValue * 10) / 10 : "?"}
                </span>
                <span className="text-[8px] text-white/20">VS</span>
                <span className={`text-sm font-black font-['JetBrains_Mono'] ${myValue !== null && theirValue !== null && theirValue > myValue ? "text-emerald-400" : "text-white/40"}`}>
                  {theirValue !== null ? Math.round(theirValue * 10) / 10 : "?"}
                </span>
              </div>
              <span className={`text-[9px] font-bold ${iWon ? "text-emerald-400" : isDraw ? "text-white/40" : "text-red-400"}`}>
                {iWon ? `+${duel.stake}` : isDraw ? "DRAW" : `-${duel.stake}`}
              </span>
            </>
          ) : (
            <span className="text-xs font-black text-[#6366F1]">VS</span>
          )}
        </div>

        {/* Them */}
        <button
          onClick={() => onViewProfile(duel.challenger_id !== userId ? duel.challenger_id : duel.opponent_id)}
          className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse"
        >
          <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden border" style={{ borderColor: `${tierAccentHex[them.tier]}50` }}>
            {them.avatar_url ? (
              <img src={`/api/img?url=${encodeURIComponent(them.avatar_url)}`} alt="" className="h-full w-full object-cover" />
            ) : <div className="h-full w-full bg-white/10" />}
          </div>
          <div className="min-w-0 text-right">
            <p className="truncate text-xs font-bold text-white">{them.username}</p>
            <p className="text-[9px]" style={{ color: tierAccentHex[them.tier] }}>{them.ovr}</p>
          </div>
        </button>
      </div>

      {/* Bottom: category + actions */}
      <div className="flex items-center justify-between border-t border-white/[0.04] px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center">{(() => { const CI = STAT_ICONS[duel.category]; return CI ? <CI size={14} className="text-white/50" /> : null; })()}</span>
          <span className="text-[10px] font-bold text-white/30">{catInfo?.short}</span>
          <span className="text-[9px] text-white/20">·</span>
          <span className="text-[9px] text-[#FFD700]/60">{duel.stake} pts</span>
        </div>

        {/* Actions for received pending duels */}
        {isReceived && (
          <div className="flex gap-2">
            <button
              onClick={onDecline}
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] font-bold text-red-400 transition hover:bg-red-500/20"
            >
              Refuser
            </button>
            <button
              onClick={onAccept}
              className="rounded-lg bg-emerald-500 px-3 py-1 text-[10px] font-bold text-white transition hover:bg-emerald-600 active:scale-95"
            >
              Accepter
            </button>
          </div>
        )}

        {/* Status badge for non-pending */}
        {duel.status === "declined" && (
          <span className="text-[10px] font-bold text-white/20">Refusé</span>
        )}
        {duel.status === "expired" && (
          <span className="text-[10px] font-bold text-white/20">Expiré</span>
        )}
        {duel.status === "pending" && !isReceived && (
          <span className="text-[10px] font-bold text-white/25 animate-pulse">En attente...</span>
        )}
      </div>
    </motion.div>
  );
}
