"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import AnimatedPage from "@/components/AnimatedPage";
import ShareButton from "@/components/ShareButton";
import BadgeGrid from "@/components/BadgeGrid";
import ProfileEditForm from "@/components/ProfileEditForm";
import type { CardTier, SpecialCardType } from "@/types";
import { tierConfig, tierBorderColors } from "@/components/VeloCard";
import { IconCycling, IconMountain, IconCalendar, IconTimer, IconStar, IconSwords, IconShield, IconChartUp, IconRocket, IconCrown, IconTrophy, IconCheck } from "@/components/icons/VeloIcons";

/* ═══════════════ Types ═══════════════ */

interface ProfileData {
  profile: {
    id: string;
    username: string;
    avatar_url: string | null;
    custom_avatar_url: string | null;
    region: string | null;
    bio: string | null;
    favorite_climb: string | null;
    bike_name: string | null;
    created_at: string;
  };
  stats: {
    pac: number; end: number; mon: number; res: number; spr: number; val: number;
    ovr: number; tier: CardTier; special_card: SpecialCardType | null;
    active_weeks_streak: number;
  };
  deltas: { pac: number; end: number; mon: number; res: number; spr: number; val: number; ovr: number } | null;
  history: {
    week_label: string; pac: number; end: number; mon: number; res: number; spr: number; val: number;
    ovr: number; tier: CardTier; weekly_km: number; weekly_dplus: number; weekly_rides: number;
  }[];
  clubs: { id: string; name: string; logo_url: string | null }[];
  weekly: { km: number; dplus: number; rides: number; time: number };
  career: {
    totalKm: number; totalDplus: number; totalRides: number; totalTime: number;
    echappeeSelections: number; warsParticipated: number; totalWarKm: number;
    victories: number; podiums: number; racesCompleted: number; totalRacePoints: number;
    recentResults: { position: number; raceName: string; raceDate: string; totalParticipants: number | null; points: number }[];
  };
}

interface SearchResult {
  user_id: string;
  username: string;
  avatar_url: string | null;
  ovr: number;
  tier: CardTier;
}

/* ═══════════════ Constants ═══════════════ */

const tierAccentHex: Record<CardTier, string> = {
  bronze: "#cd7f32", argent: "#B8A0D8", platine: "#E0E8F0", diamant: "#B9F2FF", legende: "#FFD700",
};

const statLabels: Record<string, string> = {
  pac: "Vitesse", mon: "Grimpeur", val: "Technique", spr: "Sprint", end: "Endurance", res: "Puissance",
};

const statIcons: Record<string, any> = {
  pac: IconStar, mon: IconMountain, val: IconStar, spr: IconRocket, end: IconTrophy, res: IconChartUp,
};

/* ═══════════════ Helper components ═══════════════ */

function DeltaBadge({ value }: { value: number }) {
  if (value === 0) return null;
  return (
    <span className={`text-[10px] font-bold ${value > 0 ? "text-emerald-400" : "text-red-400"}`}>
      {value > 0 ? "↑" : "↓"}{Math.abs(value)}
    </span>
  );
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}min`;
  return `${h}h${m > 0 ? m + "m" : ""}`;
}

function formatWeekLabel(label: string): string {
  // "2026-W07" → "S07"
  const match = label.match(/W(\d+)/);
  return match ? `S${match[1]}` : label;
}

/* ═══════════════ Main Page ═══════════════ */

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const { data: session } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stats" | "history" | "career">("stats");
  const [editOpen, setEditOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.profile) setData(json);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const results = await res.json();
      setSearchResults(Array.isArray(results) ? results : []);
    } catch { setSearchResults([]); }
    finally { setSearchLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(searchQuery), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, doSearch]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Check if the viewer is the profile owner
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => { if (p?.id === userId) setIsOwner(true); })
      .catch(() => {});
  }, [session, userId]);

  /* ——— Loading ——— */
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center gap-4 px-4 pb-24 pt-12">
        <div className="h-24 w-24 animate-pulse rounded-full bg-white/5" />
        <div className="h-6 w-32 animate-pulse rounded-lg bg-white/5" />
        <div className="h-4 w-20 animate-pulse rounded bg-white/5" />
        <div className="mt-8 h-64 w-full max-w-md animate-pulse rounded-2xl bg-white/5" />
      </main>
    );
  }

  if (!data) {
    return (
      <AnimatedPage className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="mb-4 text-4xl"><IconStar size={32} className="text-white/40" /></div>
        <p className="text-sm text-white/40">Profil introuvable</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 rounded-full bg-[#6366F1] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5557E0]"
        >
          Retour au dashboard
        </button>
      </AnimatedPage>
    );
  }

  const { profile, stats, deltas, history, clubs, weekly, career } = data;
  const accent = tierAccentHex[stats.tier];
  const config = tierConfig[stats.tier];

  const displayAvatarUrl = profile.custom_avatar_url || profile.avatar_url;

  // Radar data
  const radarData = [
    { stat: "VIT", value: stats.pac, fullMark: 99 },
    { stat: "MON", value: stats.mon, fullMark: 99 },
    { stat: "TEC", value: stats.val, fullMark: 99 },
    { stat: "PUI", value: stats.res, fullMark: 99 },
    { stat: "END", value: stats.end, fullMark: 99 },
    { stat: "SPR", value: stats.spr, fullMark: 99 },
  ];

  // Chart data for progression
  const chartData = history.map((h) => ({
    week: formatWeekLabel(h.week_label),
    ovr: h.ovr,
    km: h.weekly_km,
  }));

  const tabs = [
    { key: "stats" as const, label: "Stats" },
    { key: "history" as const, label: "Progression" },
    { key: "career" as const, label: "Carrière" },
  ];

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-8">
      {/* ═══ Search overlay ═══ */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center pt-16 px-4">
              <div className="w-full max-w-md">
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un coureur..."
                    className="w-full rounded-xl border border-white/20 bg-white/10 py-3.5 pl-4 pr-12 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#6366F1]/50"
                  />
                  <button
                    onClick={() => { setSearchOpen(false); setSearchQuery(""); setSearchResults([]); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
                  >
                    ✕
                  </button>
                </div>

                {/* Results */}
                <div className="mt-3 flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                  {searchLoading && (
                    <div className="py-8 text-center text-sm text-white/30">Recherche...</div>
                  )}
                  {!searchLoading && searchResults.map((user) => (
                    <button
                      key={user.user_id}
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                        setSearchResults([]);
                        router.push(`/profile/${user.user_id}`);
                      }}
                      className={`rounded-xl border ${tierBorderColors[user.tier]} bg-gradient-to-r ${tierConfig[user.tier].bg} p-3 text-left transition hover:scale-[1.01]`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full overflow-hidden border border-white/10">
                          {user.avatar_url ? (
                            <img src={`/api/img?url=${encodeURIComponent(user.avatar_url)}`} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-white/10" />
                          )}
                        </div>
                        <span className="text-sm font-bold text-white flex-1">{user.username}</span>
                        <span className="text-lg font-black font-['JetBrains_Mono']" style={{ color: tierAccentHex[user.tier] }}>
                          {user.ovr}
                        </span>
                      </div>
                    </button>
                  ))}
                  {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
                    <div className="py-8 text-center text-sm text-white/30">Aucun résultat</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Tier gradient banner ═══ */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-48"
        style={{ background: `linear-gradient(180deg, ${accent}12 0%, transparent 100%)` }}
      />

      {/* ═══ Top bar: search + share ═══ */}
      <div className="relative z-10 flex w-full max-w-md items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white transition"
        >
          ←
        </button>
        <button
          onClick={() => setSearchOpen(true)}
          className="flex h-9 items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 text-xs text-white/40 hover:text-white/60 transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          Rechercher
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/card/${userId}`)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white transition"
            title="Voir la carte"
          >
            <IconStar size={18} />
          </button>
          <ShareButton
            tier={stats.tier}
            userId={userId}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white transition"
          />
        </div>
      </div>

      {/* ═══ Avatar + Name + OVR ═══ */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <div
            className="rounded-full p-[3px]"
            style={{ background: `linear-gradient(180deg, ${accent}cc, ${accent}40)` }}
          >
            <div className="rounded-full border-[3px] border-black/50 overflow-hidden">
              {displayAvatarUrl ? (
                <img
                  src={profile.custom_avatar_url ? profile.custom_avatar_url : `/api/img?url=${encodeURIComponent(displayAvatarUrl)}`}
                  alt={profile.username}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-white/10 flex items-center justify-center text-2xl text-white/30">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <h1 className="mt-4 text-xl font-black tracking-wide text-white font-['Space_Grotesk']">
          {profile.username}
        </h1>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: accent }}>
            {config.label}
          </span>
          {stats.special_card && (
            <span className="rounded-full px-2 py-0.5 text-[9px] font-bold flex items-center gap-1" style={{
              color: accent,
              backgroundColor: `${accent}15`,
              border: `1px solid ${accent}30`,
            }}>
              {stats.special_card === "totw" ? (
                <><IconStar size={10} /> ÉCHAPPÉE</>
              ) : stats.special_card === "in_form" ? (
                <><IconChartUp size={10} /> IN FORM</>
              ) : (
                <><IconTrophy size={10} /> LÉGENDE</>
              )}
            </span>
          )}
        </div>

        {/* OVR big number */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 12, delay: 0.1 }}
          className="mt-3 flex items-baseline gap-2"
        >
          <span className="text-5xl font-black font-['JetBrains_Mono']" style={{ color: accent }}>
            {stats.ovr}
          </span>
          <span className="text-xs font-bold text-white/30">OVR</span>
          {deltas && deltas.ovr !== 0 && (
            <span className={`text-sm font-bold ${deltas.ovr > 0 ? "text-emerald-400" : "text-red-400"}`}>
              {deltas.ovr > 0 ? "+" : ""}{deltas.ovr}
            </span>
          )}
        </motion.div>

        {/* Streak + Region */}
        <div className="mt-2 flex items-center gap-3">
          {stats.active_weeks_streak > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold text-orange-400">
              <IconChartUp size={10} /> {stats.active_weeks_streak} sem.
            </span>
          )}
          {profile.region && (
            <span className="flex items-center gap-1 text-[10px] text-white/30">
              <IconStar size={10} /> {profile.region}
            </span>
          )}
        </div>
      </div>

      {/* ═══ Bio & Details ═══ */}
      {(profile.bio || profile.bike_name || profile.favorite_climb) && (
        <div className="relative z-10 mt-3 flex flex-col items-center gap-1 max-w-[280px] text-center">
          {profile.bio && (
            <p className="text-xs text-white/50 leading-relaxed">{profile.bio}</p>
          )}
          <div className="flex items-center gap-3 text-[10px] text-white/25 mt-1">
            {profile.bike_name && <span>{profile.bike_name}</span>}
            {profile.bike_name && profile.favorite_climb && <span>|</span>}
            {profile.favorite_climb && <span>{profile.favorite_climb}</span>}
          </div>
        </div>
      )}

      {/* ═══ Edit button (own profile only) ═══ */}
      {isOwner && (
        <button
          onClick={() => setEditOpen(true)}
          className="relative z-10 mt-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-semibold text-white/40 transition hover:bg-white/10 hover:text-white/60"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Modifier le profil
        </button>
      )}

      {/* ═══ Quick weekly stats ═══ */}
      <div className="relative z-10 mt-6 w-full max-w-md">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "KM", value: weekly.km.toFixed(1), iconKey: "cycling" },
            { label: "D+", value: `${weekly.dplus}m`, iconKey: "mountain" },
            { label: "Sorties", value: weekly.rides, iconKey: "calendar" },
            { label: "Temps", value: formatTime(weekly.time), iconKey: "timer" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
            >
              <span className="flex justify-center">{(() => { const icons: Record<string, any> = { cycling: IconCycling, mountain: IconMountain, calendar: IconCalendar, timer: IconTimer }; const I = icons[item.iconKey]; return I ? <I size={16} className="text-white/50" /> : null; })()}</span>
              <span className="mt-1 text-sm font-black text-white font-['JetBrains_Mono']">
                {item.value}
              </span>
              <span className="text-[8px] font-bold tracking-wider text-white/30">
                {item.label}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-center text-[9px] text-white/20">Cette semaine</p>
      </div>

      {/* ═══ Tabs ═══ */}
      <div className="relative z-10 mt-6 w-full max-w-md">
        <div className="flex rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex-1 rounded-lg py-2 text-xs font-bold transition ${
                activeTab === tab.key ? "text-white" : "text-white/30 hover:text-white/50"
              }`}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="profile-tab"
                  className="absolute inset-0 rounded-lg"
                  style={{ backgroundColor: `${accent}15`, border: `1px solid ${accent}25` }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative">
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* ═══ Tab content ═══ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-4"
          >
            {activeTab === "stats" && (
              <StatsTab stats={stats} deltas={deltas} accent={accent} tier={stats.tier} radarData={radarData} clubs={clubs} />
            )}
            {activeTab === "history" && (
              <HistoryTab chartData={chartData} history={history} accent={accent} />
            )}
            {activeTab === "career" && (
              <CareerTab career={career} profile={profile} accent={accent} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══ Badges ═══ */}
      <div className="relative z-10 mt-6 w-full max-w-md">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10px] font-bold tracking-wider text-white/30 mb-3">BADGES</p>
          <BadgeGrid userId={userId} />
        </div>
      </div>

      {/* ═══ Edit modal ═══ */}
      {isOwner && (
        <ProfileEditForm
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          currentData={{
            bio: profile.bio || "",
            favorite_climb: profile.favorite_climb || "",
            bike_name: profile.bike_name || "",
            region: profile.region || "",
            avatar_url: displayAvatarUrl,
          }}
          onSaved={fetchProfile}
        />
      )}
    </AnimatedPage>
  );
}

/* ═══════════════ Stats Tab ═══════════════ */

function StatsTab({
  stats, deltas, accent, tier, radarData, clubs,
}: {
  stats: ProfileData["stats"]; deltas: ProfileData["deltas"]; accent: string; tier: CardTier;
  radarData: { stat: string; value: number; fullMark: number }[];
  clubs: ProfileData["clubs"];
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Radar chart */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-[10px] font-bold tracking-wider text-white/30 mb-2">RADAR DE STATS</p>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis
              dataKey="stat"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700 }}
            />
            <Radar
              dataKey="value"
              stroke={accent}
              fill={accent}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-3 gap-2">
        {(["pac", "mon", "val", "spr", "end", "res"] as const).map((key) => (
          <div
            key={key}
            className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
          >
            <span className="flex items-center">{(() => { const I = statIcons[key]; return I ? <I size={18} className="text-white/60" /> : null; })()}</span>
            <span className="mt-1 text-xl font-black font-['JetBrains_Mono']" style={{ color: accent }}>
              {stats[key]}
            </span>
            {deltas && <DeltaBadge value={deltas[key]} />}
            <span className="mt-0.5 text-[8px] font-bold tracking-wider text-white/30">
              {statLabels[key].toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      {/* Clubs */}
      {clubs.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10px] font-bold tracking-wider text-white/30 mb-3">CLUBS</p>
          <div className="flex flex-wrap gap-2">
            {clubs.map((club) => (
              <div
                key={club.id}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
              >
                {club.logo_url && (
                  <img
                    src={`/api/img?url=${encodeURIComponent(club.logo_url)}`}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                )}
                <span className="text-xs font-semibold text-white/70">{club.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ History Tab ═══════════════ */

function HistoryTab({
  chartData, history, accent,
}: {
  chartData: { week: string; ovr: number; km: number }[];
  history: ProfileData["history"];
  accent: string;
}) {
  if (chartData.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="text-3xl mb-2 flex justify-center"><IconChartUp size={32} className="text-white/30" /></div>
        <p className="text-sm text-white/30">Pas encore d'historique</p>
        <p className="text-xs text-white/20 mt-1">Les données apparaîtront après le premier Monday Update</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* OVR progression chart */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-[10px] font-bold tracking-wider text-white/30 mb-2">PROGRESSION OVR</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="ovrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accent} stopOpacity={0.3} />
                <stop offset="95%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="week"
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(10,10,18,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "11px",
              }}
              labelStyle={{ color: "rgba(255,255,255,0.5)" }}
            />
            <Area
              type="monotone"
              dataKey="ovr"
              stroke={accent}
              strokeWidth={2}
              fill="url(#ovrGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly KM chart */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-[10px] font-bold tracking-wider text-white/30 mb-2">KILOMÈTRES HEBDO</p>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="kmGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00F5D4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00F5D4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="week"
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(10,10,18,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "11px",
              }}
            />
            <Area
              type="monotone"
              dataKey="km"
              stroke="#00F5D4"
              strokeWidth={2}
              fill="url(#kmGrad)"
              name="KM"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly history list */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-[10px] font-bold tracking-wider text-white/30 mb-3">DÉTAIL PAR SEMAINE</p>
        <div className="flex flex-col gap-2">
          {[...history].reverse().slice(0, 8).map((h, i) => (
            <motion.div
              key={h.week_label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2"
            >
              <span className="text-[10px] font-bold text-white/30 w-8">{formatWeekLabel(h.week_label)}</span>
              <span className="text-sm font-black font-['JetBrains_Mono'] text-white/80 w-8">{h.ovr}</span>
              <div className="flex-1 flex items-center gap-2 text-[10px] text-white/30">
                <span className="flex items-center gap-1"><IconCycling size={10} /> {h.weekly_km.toFixed(1)}km</span>
                <span className="flex items-center gap-1"><IconMountain size={10} /> {h.weekly_dplus}m</span>
                <span>×{h.weekly_rides}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Career Tab ═══════════════ */

function CareerTab({
  career, profile, accent,
}: {
  career: ProfileData["career"]; profile: ProfileData["profile"]; accent: string;
}) {
  const memberSince = new Date(profile.created_at);
  const months = Math.max(1, Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24 * 30)));

  const positionColor = (pos: number) => {
    if (pos === 1) return "#FFD700";
    if (pos === 2) return "#C0C0C0";
    if (pos === 3) return "#CD7F32";
    return "rgba(255,255,255,0.5)";
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    } catch { return dateStr; }
  };

  const achievements = [
    { iconKey: "cycling", label: "Total KM", value: `${(career.totalKm ?? 0).toLocaleString()} km`, condition: (career.totalKm ?? 0) > 0 },
    { iconKey: "mountain", label: "Total D+", value: `${(career.totalDplus ?? 0).toLocaleString()} m`, condition: (career.totalDplus ?? 0) > 0 },
    { iconKey: "calendar", label: "Sorties", value: (career.totalRides ?? 0).toString(), condition: (career.totalRides ?? 0) > 0 },
    { iconKey: "timer", label: "Temps Total", value: formatTime(career.totalTime ?? 0), condition: (career.totalTime ?? 0) > 0 },
    { iconKey: "star", label: "Echappees", value: (career.echappeeSelections ?? 0).toString(), condition: (career.echappeeSelections ?? 0) > 0 },
    { iconKey: "swords", label: "Guerres", value: (career.warsParticipated ?? 0).toString(), condition: (career.warsParticipated ?? 0) > 0 },
    { iconKey: "calendar", label: "Membre depuis", value: `${months} mois`, condition: true },
  ];

  const milestones = [
    { iconKey: "star", name: "Premier Coup de Pedale", desc: "1ere sortie enregistree", unlocked: (career.totalRides ?? 0) >= 1 },
    { iconKey: "trophy", name: "Centurion", desc: "100 km cumules", unlocked: (career.totalKm ?? 0) >= 100 },
    { iconKey: "mountain", name: "Col Hunter", desc: "1000 m D+ cumules", unlocked: (career.totalDplus ?? 0) >= 1000 },
    { iconKey: "chartup", name: "Machine", desc: "1000 km cumules", unlocked: (career.totalKm ?? 0) >= 1000 },
    { iconKey: "star", name: "Echappe", desc: "Selectionne dans L'Echappee", unlocked: (career.echappeeSelections ?? 0) >= 1 },
    { iconKey: "swords", name: "Guerrier", desc: "Participer a une Guerre", unlocked: (career.warsParticipated ?? 0) >= 1 },
    { iconKey: "rocket", name: "Ultra", desc: "5000 km cumules", unlocked: (career.totalKm ?? 0) >= 5000 },
    { iconKey: "crown", name: "Roi de la Montagne", desc: "10 000 m D+", unlocked: (career.totalDplus ?? 0) >= 10000 },
  ];

  const hasRaceData = (career.racesCompleted ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Race Palmares — Top section */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-[10px] font-bold tracking-wider text-white/30 mb-3">PALMARES COURSE</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center rounded-xl border border-yellow-500/20 bg-yellow-500/[0.06] p-3">
            <p className="text-2xl font-black font-['JetBrains_Mono']" style={{ color: "#FFD700" }}>{career.victories ?? 0}</p>
            <p className="text-[9px] font-bold tracking-wider text-white/30">VICTOIRES</p>
          </div>
          <div className="text-center rounded-xl border border-gray-400/20 bg-gray-400/[0.06] p-3">
            <p className="text-2xl font-black font-['JetBrains_Mono']" style={{ color: "#C0C0C0" }}>{career.podiums ?? 0}</p>
            <p className="text-[9px] font-bold tracking-wider text-white/30">PODIUMS</p>
          </div>
          <div className="text-center rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] p-3">
            <p className="text-2xl font-black font-['JetBrains_Mono']" style={{ color: "#6366F1" }}>{career.racesCompleted ?? 0}</p>
            <p className="text-[9px] font-bold tracking-wider text-white/30">COURSES</p>
          </div>
        </div>

        {career.totalRacePoints > 0 && (
          <div className="text-center rounded-lg bg-white/[0.03] py-2">
            <span className="text-sm font-black font-['JetBrains_Mono'] text-white">{career.totalRacePoints}</span>
            <span className="text-[10px] text-white/30 ml-1.5">points course</span>
          </div>
        )}

        {/* Recent Results */}
        {hasRaceData && career.recentResults && career.recentResults.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-bold tracking-wider text-white/30 mb-2">DERNIERS RESULTATS</p>
            <div className="flex flex-col gap-1.5">
              {career.recentResults.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2"
                >
                  <span
                    className="text-base font-black font-['JetBrains_Mono'] w-7 text-center"
                    style={{ color: positionColor(r.position) }}
                  >
                    {r.position}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">{r.raceName}</p>
                    <p className="text-[9px] text-white/30">
                      {formatDate(r.raceDate)}
                      {r.totalParticipants ? ` \u00B7 ${r.totalParticipants} participants` : ""}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {!hasRaceData && (
          <p className="text-[11px] text-white/20 text-center py-4">Aucun resultat de course enregistre</p>
        )}
      </div>

      {/* Strava career stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {achievements.filter((a) => a.condition).map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
          >
            <span className="flex items-center">{(() => { const icons: Record<string, any> = { cycling: IconCycling, mountain: IconMountain, calendar: IconCalendar, timer: IconTimer, star: IconStar, swords: IconSwords, shield: IconShield }; const I = icons[item.iconKey]; return I ? <I size={20} className="text-white/50" /> : null; })()}</span>
            <div>
              <p className="text-sm font-black text-white font-['JetBrains_Mono']">{item.value}</p>
              <p className="text-[9px] font-bold tracking-wider text-white/30">{item.label.toUpperCase()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Achievements / Badges */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-[10px] font-bold tracking-wider text-white/30 mb-3">ACHIEVEMENTS</p>
        <div className="grid grid-cols-2 gap-2">
          {milestones.map((m) => (
            <div
              key={m.name}
              className={`flex items-center gap-2.5 rounded-xl border p-3 transition ${
                m.unlocked
                  ? "border-white/10 bg-white/[0.04]"
                  : "border-white/[0.04] bg-white/[0.01] opacity-40"
              }`}
            >
              <span className={`flex items-center ${m.unlocked ? "" : "opacity-30"}`}>{(() => { const icons: Record<string, any> = { star: IconStar, chartup: IconChartUp, mountain: IconMountain, swords: IconSwords, rocket: IconRocket, crown: IconCrown, trophy: IconTrophy }; const I = icons[m.iconKey]; return I ? <I size={20} className="text-white/60" /> : null; })()}</span>
              <div>
                <p className="text-[11px] font-bold text-white">{m.name}</p>
                <p className="text-[9px] text-white/30">{m.desc}</p>
              </div>
              {m.unlocked && (
                <IconCheck size={12} className="ml-auto text-emerald-400" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
