# PROMPT PERFORMANCE 100/100 — VeloCard

> **Objectif** : Faire passer le score Performance de **50/100 à 100/100**.
> L'audit identifie 4 problèmes majeurs : N+1 queries, pas de React Query/cache, images non optimisées, pas de memoization.
> Ce prompt couvre **8 chantiers** pour une app rapide, cachée, et optimisée.

---

## CONTEXTE TECHNIQUE

- **Stack** : Next.js 15 (App Router), TypeScript strict, Supabase, Tailwind CSS v4, Framer Motion
- **React Query** : `@tanstack/react-query` déjà installé (v5.90.21) — utilisé dans `DashboardFeed.tsx` mais PAS dans le reste de l'app
- **next.config.ts** : `optimizePackageImports` pour framer-motion/recharts, compression activée, images remotePatterns configurés
- **Bundler** : webpack alias pour framer-motion ES bundle
- **API Pattern** : routes dans `src/app/api/`, services dans `src/services/`
- **DB** : Supabase avec `supabaseAdmin` (service role)

---

## CHANTIER 1 — Élimination des N+1 Queries

### 1.1 — War Service : boucle séquentielle → requête batch

**Fichier** : `src/services/war.service.ts`

**AVANT** (lignes 63-91) — N+1 boucle sur chaque club :
```typescript
for (const membership of memberships) {
  const cid = membership.club_id;

  const { data: existing } = await supabaseAdmin
    .from("wars").select("*")
    .eq("week_label", weekBounds.week_label)
    .eq("status", "active")
    .or(`club_a_id.eq.${cid},club_b_id.eq.${cid}`)
    .single();

  if (existing) { activeWar = existing; break; }

  const { data: finished } = await supabaseAdmin
    .from("wars").select("*")
    .eq("week_label", weekBounds.week_label)
    .eq("status", "finished")
    .or(`club_a_id.eq.${cid},club_b_id.eq.${cid}`)
    .single();

  if (finished) { activeWar = finished; break; }
}
```

**APRÈS** — une seule requête :
```typescript
const clubIds = memberships.map((m: any) => m.club_id);

// UNE seule requête pour trouver la guerre de n'importe quel club
const orConditions = clubIds
  .flatMap((cid: string) => [`club_a_id.eq.${cid}`, `club_b_id.eq.${cid}`])
  .join(",");

const { data: wars } = await supabaseAdmin
  .from("wars")
  .select("*")
  .eq("week_label", weekBounds.week_label)
  .or(orConditions)
  .in("status", ["active", "finished"])
  .order("status", { ascending: true }) // "active" avant "finished"
  .limit(1);

const activeWar = wars?.[0] ?? null;
```

**Impact** : Passe de 2×N queries (N = nombre de clubs) à **1 query**.

### 1.2 — War Service : matchmaking member count batch

**AVANT** (lignes 94-111) — N+1 count par club :
```typescript
for (const membership of memberships) {
  const cid = membership.club_id;
  const { count } = await supabaseAdmin
    .from("club_members")
    .select("*", { count: "exact", head: true })
    .eq("club_id", cid);

  if ((count ?? 0) < 3) { return { ... club_too_small: true }; }
}
```

**APRÈS** — une seule requête :
```typescript
const clubIds = memberships.map((m: any) => m.club_id);

// Récupérer le nombre de membres de TOUS les clubs en une requête
const { data: memberCounts } = await supabaseAdmin
  .from("club_members")
  .select("club_id")
  .in("club_id", clubIds);

const countMap = new Map<string, number>();
for (const m of memberCounts || []) {
  countMap.set(m.club_id, (countMap.get(m.club_id) || 0) + 1);
}

// Trouver le premier club avec assez de membres
const eligibleClubId = clubIds.find((cid: string) => (countMap.get(cid) || 0) >= 3);

if (!eligibleClubId) {
  return { war: null, no_club: false, club_too_small: true, no_match_found: false, is_debrief_day: false };
}
```

### 1.3 — Monday Update : batch les activités au lieu de boucler par user

**Fichier** : `src/services/monday-update.service.ts`

**Problème** : La boucle `for (const userStat of allStats)` fait **8+ queries par user** (lignes 129-353). Pour 1000 users = 8000+ queries.

**APRÈS** — Pré-charger toutes les données en batch AVANT la boucle :

```typescript
export async function runMondayUpdate() {
  const weekLabel = getWeekLabel();
  const prevWeekLabel = getWeekLabel(-1);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // 1. Fetch all users with their current stats
  const { data: allStats } = await supabaseAdmin
    .from("user_stats")
    .select("*, profiles!inner(id, strava_id, username, avatar_url)");

  if (!allStats || allStats.length === 0) {
    return { success: true, week: weekLabel, updated: 0, decayed: 0 };
  }

  const allUserIds = allStats.map((s: any) => s.user_id);

  // 2. BATCH : charger TOUTES les données nécessaires en parallèle
  const [
    weekActivitiesRes,
    allActivitiesRes,
    weekRaceResultsRes,
    activeBoostsRes,
    recentPodiumsRes,
  ] = await Promise.all([
    // Activités de la semaine (pour tous les users)
    supabaseAdmin
      .from("strava_activities")
      .select("user_id, distance, total_elevation_gain, max_speed, average_speed, moving_time, elapsed_time, weighted_average_watts, start_date, activity_type, strava_activity_id, name")
      .in("user_id", allUserIds)
      .eq("activity_type", "Ride")
      .gte("start_date", oneWeekAgo.toISOString()),

    // Toutes les activités récentes (50 par user → on prend les 50 * N plus récentes puis on filtre)
    supabaseAdmin
      .from("strava_activities")
      .select("user_id, distance, total_elevation_gain, max_speed, average_speed, moving_time, elapsed_time, weighted_average_watts, start_date, activity_type, strava_activity_id, name")
      .in("user_id", allUserIds)
      .eq("activity_type", "Ride")
      .order("start_date", { ascending: false })
      .limit(allUserIds.length * 50),

    // Résultats de course de la semaine
    supabaseAdmin
      .from("race_results")
      .select("user_id, position, race_id, created_at, races!inner(total_participants, federation, distance_km, elevation_gain, rdi_score)")
      .in("user_id", allUserIds)
      .gte("created_at", oneWeekAgo.toISOString()),

    // Boosts actifs
    supabaseAdmin
      .from("user_inventory")
      .select("user_id, pack_items(item_type, effect)")
      .in("user_id", allUserIds)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString()),

    // Podiums récents (pour in-form card)
    supabaseAdmin
      .from("race_results")
      .select("user_id, position, created_at")
      .in("user_id", allUserIds)
      .lte("position", 3)
      .order("created_at", { ascending: false }),
  ]);

  // 3. Indexer par user_id en Maps pour lookup O(1)
  const weekActivitiesByUser = groupBy(weekActivitiesRes.data || [], "user_id");
  const allActivitiesByUser = groupByLimited(allActivitiesRes.data || [], "user_id", 50);
  const weekRaceResultsByUser = groupBy(weekRaceResultsRes.data || [], "user_id");
  const activeBoostsByUser = groupBy(activeBoostsRes.data || [], "user_id");
  const podiumsByUser = groupByLimited(recentPodiumsRes.data || [], "user_id", 3);

  // 4. Préparer les batch inserts
  const historyUpserts: any[] = [];
  const statsUpdates: any[] = [];
  const currentHistoryUpserts: any[] = [];

  // 5. Boucle SANS queries DB
  for (const userStat of allStats) {
    const userId = userStat.user_id;

    // Snapshot to history
    historyUpserts.push({
      user_id: userId,
      week_label: prevWeekLabel,
      pac: userStat.pac, end: userStat.end, mon: userStat.mon,
      res: userStat.res, spr: userStat.spr, val: userStat.val,
      ovr: userStat.ovr, tier: userStat.tier, special_card: userStat.special_card,
    });

    // Calculs avec les données pré-chargées
    const weekActs = weekActivitiesByUser.get(userId) || [];
    const allActs = allActivitiesByUser.get(userId) || [];
    const weekResults = weekRaceResultsByUser.get(userId) || [];
    const boosts = activeBoostsByUser.get(userId) || [];
    const podiums = podiumsByUser.get(userId) || [];

    // ... même logique de calcul qu'avant, mais sans DB calls ...
    // computeStats(), getTier(), getRaceBonus(), etc.

    // Accumuler les updates au lieu d'écrire un par un
    statsUpdates.push({ userId, newStats, newTier, specialCard, newStreak, ... });
  }

  // 6. BATCH inserts/updates à la fin
  // Snapshot history — un seul upsert batch
  if (historyUpserts.length > 0) {
    await supabaseAdmin.from("stats_history").upsert(historyUpserts, { onConflict: "user_id,week_label" });
  }

  // Stats updates — batch par chunks de 100
  for (let i = 0; i < statsUpdates.length; i += 100) {
    const chunk = statsUpdates.slice(i, i + 100);
    await Promise.all(chunk.map((u) =>
      supabaseAdmin.from("user_stats").update({ ... }).eq("user_id", u.userId)
    ));
  }

  // Current week history — un seul upsert batch
  if (currentHistoryUpserts.length > 0) {
    await supabaseAdmin.from("stats_history").upsert(currentHistoryUpserts, { onConflict: "user_id,week_label" });
  }
}

// Helper : grouper un tableau par une clé
function groupBy<T>(items: T[], key: string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = (item as any)[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return map;
}

// Helper : grouper avec une limite par groupe
function groupByLimited<T>(items: T[], key: string, limit: number): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = (item as any)[key];
    if (!map.has(k)) map.set(k, []);
    const arr = map.get(k)!;
    if (arr.length < limit) arr.push(item);
  }
  return map;
}
```

**Impact** : Passe de **8×N queries** (N = nombre d'users) à **6 queries batch** + N updates (parallélisées par chunks). Pour 1000 users : 8000 → ~16 queries.

### 1.4 — Clubs API : count via agrégation

**Fichier** : `src/app/api/clubs/route.ts`

**AVANT** :
```typescript
const { data: members } = await supabaseAdmin
  .from("club_members")
  .select("club_id")
  .in("club_id", clubIds);

// Manual count in JS
const countMap: Record<string, number> = {};
for (const m of members || []) {
  countMap[m.club_id] = (countMap[m.club_id] || 0) + 1;
}
```

**APRÈS** — utiliser un RPC SQL ou un count direct :
```typescript
// Solution 1 : Joindre directement
const { data: clubs } = await supabaseAdmin
  .from("clubs")
  .select("*, club_members(count)")
  .order("created_at", { ascending: false });

// Chaque club a maintenant club_members[0].count
```

### 1.5 — Wars lib : matchmaking N+1 sur getClubScore

**Fichier** : `src/lib/wars.ts` — lignes 243-255

**AVANT** — boucle N+1 :
```typescript
for (const c of allClubs) {
  if (clubsInWar.has(c.id)) continue;
  const info = await getClubScore(c.id); // 2 queries par club !
  if (info.memberCount < MIN_MEMBERS) continue;
  candidates.push({ ... });
}
```

**APRÈS** — batch tous les clubs en une fois :
```typescript
// Récupérer tous les membres + stats en 2 queries batch
const availableClubIds = allClubs
  .filter((c: any) => !clubsInWar.has(c.id))
  .map((c: any) => c.id);

const [membersRes, statsRes] = await Promise.all([
  supabaseAdmin.from("club_members").select("club_id, user_id").in("club_id", availableClubIds),
  supabaseAdmin.from("user_stats").select('user_id, ovr, pac, "end", mon'),
]);

// Construire les scores par club en mémoire
const membersByClub = groupBy(membersRes.data || [], "club_id");
const statsMap = new Map((statsRes.data || []).map((s: any) => [s.user_id, s]));

const candidates = [];
for (const clubId of availableClubIds) {
  const members = membersByClub.get(clubId) || [];
  if (members.length < MIN_MEMBERS) continue;

  const avgScore = members.reduce((sum, m) => {
    const s = statsMap.get(m.user_id);
    return sum + (s?.ovr || 0);
  }, 0) / members.length;

  candidates.push({
    id: clubId,
    score: Math.round(avgScore),
    memberCount: members.length,
    diff: Math.abs(avgScore - clubInfo.score),
  });
}
```

**Impact** : Passe de **2×N queries** (N = nombre de clubs candidats) à **2 queries**.

---

## CHANTIER 2 — React Query Partout (remplacer useState/useEffect)

### 2.1 — QueryClient Provider

**Fichier** : `src/components/Providers.tsx`

Vérifier que `QueryClientProvider` est déjà wrappé. Si oui, configurer les defaults :

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,     // 2 minutes avant re-fetch
      gcTime: 10 * 60 * 1000,        // 10 minutes en cache
      refetchOnWindowFocus: false,    // Pas de refetch au focus (économie réseau)
      retry: 1,                       // 1 seul retry en cas d'erreur
    },
  },
});
```

### 2.2 — Hooks React Query centralisés

**Fichier** : Nouveau `src/hooks/useApiQueries.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ——— Leaderboard ———
export function useLeaderboard(region: string, sort: string, scope: string) {
  return useQuery({
    queryKey: ["leaderboard", region, sort, scope],
    queryFn: async () => {
      const params = new URLSearchParams({ region, sort, scope });
      const res = await fetch(`/api/leaderboard?${params}`);
      if (!res.ok) throw new Error("Erreur leaderboard");
      return res.json();
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

// ——— Race Points ———
export function useRacePoints(region: string) {
  return useQuery({
    queryKey: ["race-points", region],
    queryFn: async () => {
      const res = await fetch(`/api/race-points?region=${region}`);
      if (!res.ok) throw new Error("Erreur race points");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ——— Duels ———
export function useDuels(filter: "pending" | "active" | "history") {
  return useQuery({
    queryKey: ["duels", filter],
    queryFn: async () => {
      const res = await fetch(`/api/duels?filter=${filter}`);
      if (!res.ok) throw new Error("Erreur duels");
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}

export function useDuelStats() {
  return useQuery({
    queryKey: ["duel-stats"],
    queryFn: async () => {
      const res = await fetch("/api/duels/stats");
      if (!res.ok) throw new Error("Erreur duel stats");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ——— User Search (pour duels) ———
export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ["user-search", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Erreur recherche");
      return res.json();
    },
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  });
}

// ——— War Dashboard ———
export function useWarDashboard() {
  return useQuery({
    queryKey: ["war-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/wars/current");
      if (!res.ok) throw new Error("Erreur guerre");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

// ——— Profile ———
export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const url = userId ? `/api/profile/${userId}` : "/api/profile";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur profil");
      return res.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

// ——— Quests ———
export function useQuests() {
  return useQuery({
    queryKey: ["quests"],
    queryFn: async () => {
      const res = await fetch("/api/quests");
      if (!res.ok) throw new Error("Erreur quêtes");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

// ——— Coins ———
export function useCoinBalance() {
  return useQuery({
    queryKey: ["coins"],
    queryFn: async () => {
      const res = await fetch("/api/coins");
      if (!res.ok) throw new Error("Erreur coins");
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}

// ——— Mutations ———
export function useAcceptDuel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (duelId: string) => {
      const res = await fetch(`/api/duels/${duelId}/accept`, { method: "POST" });
      if (!res.ok) throw new Error("Erreur acceptation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duels"] });
      queryClient.invalidateQueries({ queryKey: ["duel-stats"] });
    },
  });
}

export function useDeclineDuel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (duelId: string) => {
      const res = await fetch(`/api/duels/${duelId}/decline`, { method: "POST" });
      if (!res.ok) throw new Error("Erreur déclin");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duels"] });
    },
  });
}

export function useCreateDuel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { opponentId: string; category: string; stake: number }) => {
      const res = await fetch("/api/duels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur création");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duels"] });
      queryClient.invalidateQueries({ queryKey: ["duel-stats"] });
    },
  });
}
```

### 2.3 — Migrer LeaderboardPage

**Fichier** : `src/app/leaderboard/page.tsx`

**AVANT** (7 useState + 3 useEffect) :
```typescript
const [racePointsEntries, setRacePointsEntries] = useState([]);
const [racePointsLoading, setRacePointsLoading] = useState(false);

useEffect(() => {
  if (mode === "race_points") fetchRacePoints();
}, [mode, effectiveRegion]);

async function fetchRacePoints() {
  setRacePointsLoading(true);
  const res = await fetch(`/api/race-points?region=${effectiveRegion}`);
  const data = await res.json();
  setRacePointsEntries(data);
  setRacePointsLoading(false);
}
```

**APRÈS** :
```typescript
import { useLeaderboard, useRacePoints } from "@/hooks/useApiQueries";

// Remplacer les useState/useEffect par React Query
const { data: leaderboardData, isLoading: lbLoading } = useLeaderboard(
  effectiveRegion, sort, scope
);

const { data: racePointsEntries = [], isLoading: racePointsLoading } = useRacePoints(effectiveRegion);
// Supprimer fetchRacePoints, racePointsLoading useState, l'useEffect
```

### 2.4 — Migrer DuelsPage

**Fichier** : `src/app/duels/page.tsx`

Remplacer les **10 useState + 6 useEffect** par :

```typescript
import { useDuels, useDuelStats, useUserSearch, useAcceptDuel, useDeclineDuel, useCreateDuel } from "@/hooks/useApiQueries";

const { data: stats } = useDuelStats();
const { data: duels = [], isLoading, refetch } = useDuels(activeTab);
const { data: searchResults = [], isLoading: searchLoading } = useUserSearch(searchQuery);
const acceptDuel = useAcceptDuel();
const declineDuel = useDeclineDuel();
const createDuel = useCreateDuel();

// Garder seulement les useState UI :
const [activeTab, setActiveTab] = useState<"pending" | "active" | "history">("pending");
const [showCreate, setShowCreate] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
const [selectedOpponent, setSelectedOpponent] = useState(null);
const [selectedCategory, setSelectedCategory] = useState("ovr");
const [selectedStake, setSelectedStake] = useState(10);
```

**Résultat** : 10 useState → 6 useState. 6 useEffect → 0 useEffect (React Query gère tout). Cache automatique. Déduplication des requêtes.

### 2.5 — Migrer toutes les pages restantes

Appliquer le même pattern (React Query) à ces pages :
- `src/app/wars/page.tsx` → `useWarDashboard()`
- `src/app/clubs/page.tsx` → `useClubs()`
- `src/app/profile/page.tsx` → `useProfile()`
- `src/app/races/page.tsx` → `useRaces(filters)`
- `src/app/echappee/page.tsx` → `useEchappee()`

---

## CHANTIER 3 — Images : `<img>` → `next/image`

**Problème** : 5 fichiers utilisent `<img>` au lieu de `next/image`. Pas d'optimisation AVIF/WebP, pas de lazy loading natif, pas de tailles responsives.

### 3.1 — Fichiers à migrer

| Fichier | Lignes | Usage |
|---------|--------|-------|
| `src/app/leaderboard/page.tsx` | 284-286 | Avatar dans les rows |
| `src/app/duels/page.tsx` | 284, 394, 412, 538, 576 | Avatars dans les duels |
| `src/app/compare/page.tsx` | Plusieurs | Avatars |
| `src/app/profile/[userId]/page.tsx` | Plusieurs | Avatar profil |
| `src/app/races/[raceId]/page.tsx` | Plusieurs | Avatars participants |

### 3.2 — Pattern de migration

**AVANT** :
```tsx
<img
  src={`/api/img?url=${encodeURIComponent(avatarUrl)}`}
  alt=""
  className="h-9 w-9 rounded-full border border-white/10"
/>
```

**APRÈS** :
```tsx
import Image from "next/image";

<Image
  src={avatarUrl || "/default-avatar.png"}
  alt={username || "Avatar"}
  width={36}
  height={36}
  className="rounded-full border border-white/10 object-cover"
  loading="lazy"
/>
```

**Important** : `next.config.ts` a déjà les `remotePatterns` configurés pour Strava, Google, GitHub. Les avatars distants seront automatiquement optimisés (AVIF/WebP, redimensionnés, cachés).

### 3.3 — Supprimer le proxy `/api/img` pour les avatars

Le proxy `/api/img` avait une utilité sécurité (SSRF prevention), mais `next/image` avec `remotePatterns` gère ça nativement. Garder le proxy uniquement pour les URLs non-avatar (GPX previews, etc.).

Pour les avatars, passer directement l'URL Strava/Google à `<Image>` :
```typescript
// Si l'URL est dans les domaines autorisés → utiliser next/image directement
// Si l'URL est inconnue → garder le proxy
const isAllowedDomain = (url: string) => {
  const allowed = ["dgalywyr863hv.cloudfront.net", "googleusercontent.com", "avatars.githubusercontent.com", "strava.com"];
  try {
    const hostname = new URL(url).hostname;
    return allowed.some((d) => hostname.includes(d));
  } catch { return false; }
};
```

### 3.4 — Composant Avatar réutilisable

**Fichier** : Nouveau `src/components/Avatar.tsx`

```typescript
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: number; // px
  className?: string;
  tier?: string;
}

export default function Avatar({ src, alt = "Avatar", size = 36, className = "", tier }: AvatarProps) {
  const borderClass = tier ? `border-tier-${tier}` : "border-white/10";

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-[#22223A] border ${borderClass} ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-white/30 text-xs">?</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full border object-cover ${borderClass} ${className}`}
      loading="lazy"
    />
  );
}
```

Utiliser `<Avatar>` partout au lieu de `<img>`.

---

## CHANTIER 4 — Memoization (React.memo, useMemo, useCallback)

### 4.1 — VeloCard : React.memo

**Fichier** : `src/components/VeloCard.tsx`

**AVANT** (ligne 1 / dernière ligne) :
```typescript
export default function VeloCard({ ... }: VeloCardProps) {
  // 940 lignes de rendering
}
```

**APRÈS** :
```typescript
import { memo } from "react";

function VeloCardInner({ ... }: VeloCardProps) {
  // 940 lignes de rendering
}

export default memo(VeloCardInner);
```

### 4.2 — DuelCard : React.memo + useCallback pour les handlers

**Fichier** : `src/app/duels/page.tsx`

**AVANT** :
```typescript
function DuelCard({ duel, userId, index, onAccept, onDecline, onViewProfile }: {...}) {
  // Complex rendering
}
```

**APRÈS** :
```typescript
const DuelCard = memo(function DuelCard({ duel, userId, index, onAccept, onDecline, onViewProfile }: {...}) {
  // Complex rendering
});
```

Et dans le parent, mémoriser les handlers :
```typescript
const handleAccept = useCallback(async (duelId: string) => {
  await acceptDuel.mutateAsync(duelId);
}, [acceptDuel]);

const handleDecline = useCallback(async (duelId: string) => {
  await declineDuel.mutateAsync(duelId);
}, [declineDuel]);

// Au lieu de :
// onAccept={() => handleAccept(duel.id)}  ← NOUVELLE FONCTION À CHAQUE RENDER
// Utiliser :
// onAccept={handleAccept}  ← STABLE
```

### 4.3 — Composants lourds à mémoriser

| Composant | Fichier | Raison |
|-----------|---------|--------|
| `VeloCard` | `src/components/VeloCard.tsx` | 940 lignes, SVG complexe |
| `VeloCard3D` | `src/components/VeloCard3D.tsx` | Tilt + gyroscope |
| `DuelCard` | `src/app/duels/page.tsx` | Liste qui re-render au search |
| `LeaderboardRow` | `src/components/LeaderboardRow.tsx` | Liste longue |
| `WarTowerBar` | `src/components/WarTowerBar.tsx` | Animations |
| `FeedItem` | `src/components/FeedItem.tsx` | Liste dynamique |
| `CourseMap` | `src/components/CourseMap.tsx` | MapLibre heavy |

Pour chacun : `export default memo(ComponentName)`.

### 4.4 — useMemo pour les calculs coûteux

Les pages `races/page.tsx` font déjà bien (6 useMemo). Appliquer le même pattern aux autres pages.

**Pattern** : tout `.filter()`, `.sort()`, `.map()` sur des tableaux > 20 éléments doit être dans un `useMemo`.

---

## CHANTIER 5 — Dynamic Imports (Code Splitting)

### 5.1 — Lazy loading des composants lourds

**Fichier** : Les pages qui utilisent des composants lourds chargés à 100% :

```typescript
import dynamic from "next/dynamic";

// Au lieu de :
// import CourseMap from "@/components/CourseMap";
const CourseMap = dynamic(() => import("@/components/CourseMap"), {
  loading: () => <div className="h-[300px] w-full animate-pulse rounded-2xl bg-white/5" />,
  ssr: false, // MapLibre ne fonctionne pas côté serveur
});

// Au lieu de :
// import { Recharts components }
const ElevationProfile = dynamic(() => import("@/components/ElevationProfile"), {
  loading: () => <div className="h-[200px] w-full animate-pulse rounded-xl bg-white/5" />,
  ssr: false,
});

// ShareModal — lazy car rarement utilisé
const ShareModal = dynamic(() => import("@/components/ShareModal"));

// MondayReveal — lazy car affiché 1x/semaine
const MondayReveal = dynamic(() => import("@/app/dashboard/MondayReveal"), {
  ssr: false,
});
```

### 5.2 — Composants à lazy-loader

| Composant | Bundle size estimé | Pages utilisatrices |
|-----------|-------------------|---------------------|
| `CourseMap` (MapLibre) | ~360 KB | races/[id], course |
| `ElevationProfile` (Recharts) | ~280 KB | races/[id] |
| `ShareModal` (html-to-image + QR) | ~150 KB | dashboard |
| `MondayReveal` (confetti + animations) | ~50 KB | dashboard |
| `VeloCard3D` (react-parallax-tilt) | ~30 KB | dashboard |
| `Confetti` | ~20 KB | dashboard |

**Impact** : Réduit le bundle initial de ~890 KB en le chargeant à la demande.

---

## CHANTIER 6 — Cache Headers API

### 6.1 — Ajouter Cache-Control sur les routes API

**Fichier** : `next.config.ts` — dans `async headers()`

Ajouter :
```typescript
{
  source: "/api/badges",
  headers: [
    { key: "Cache-Control", value: "private, max-age=60, stale-while-revalidate=120" },
  ],
},
{
  source: "/api/echappee",
  headers: [
    { key: "Cache-Control", value: "public, s-maxage=600, stale-while-revalidate=1200" },
  ],
},
{
  source: "/api/totw",
  headers: [
    { key: "Cache-Control", value: "public, s-maxage=600, stale-while-revalidate=1200" },
  ],
},
{
  source: "/api/clubs",
  headers: [
    { key: "Cache-Control", value: "public, s-maxage=120, stale-while-revalidate=300" },
  ],
},
{
  source: "/api/feed",
  headers: [
    { key: "Cache-Control", value: "private, max-age=30, stale-while-revalidate=60" },
  ],
},
{
  source: "/api/races",
  headers: [
    { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=600" },
  ],
},
```

### 6.2 — Cache côté React Query

Déjà configuré dans le chantier 2 avec `staleTime` et `gcTime`. React Query ne re-fetch pas tant que les données sont "fraîches".

---

## CHANTIER 7 — Parallel Fetches (waterfalls → Promise.all)

### 7.1 — Dashboard : fetch combiné

**Fichier** : `src/app/dashboard/DashboardFeed.tsx`

**AVANT** — 3 queries React Query séparées :
```typescript
const { data: weekly } = useQuery({ queryKey: ["dashboard-weekly", userId], ... });
const { data: echappee } = useQuery({ queryKey: ["dashboard-echappee"], ... });
const { data: feedEvents } = useQuery({ queryKey: ["dashboard-feed", userId], ... });
```

**APRÈS** — Créer un endpoint combiné OU garder React Query (qui les lance en parallèle automatiquement si elles ont des queryKeys différents — c'est déjà optimal).

**Mieux** : créer une route API combinée `/api/dashboard` :

**Fichier** : Nouveau `src/app/api/dashboard/route.ts`

```typescript
import { getAuthenticatedUser, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    // Toutes les requêtes en parallèle
    const [weeklyRes, echappeeRes, feedRes, statsRes, badgesRes] = await Promise.all([
      // Weekly stats
      supabaseAdmin
        .from("strava_activities")
        .select("distance, total_elevation_gain")
        .eq("user_id", user.profileId)
        .eq("activity_type", "Ride")
        .gte("start_date", getMondayISO()),

      // Echappée
      supabaseAdmin
        .from("team_of_the_week")
        .select("*, profiles(username, avatar_url)")
        .eq("week_label", getCurrentWeekLabel())
        .limit(8),

      // Feed
      supabaseAdmin
        .from("activity_feed")
        .select("*")
        .eq("user_id", user.profileId)
        .order("created_at", { ascending: false })
        .limit(10),

      // User stats
      supabaseAdmin
        .from("user_stats")
        .select("*")
        .eq("user_id", user.profileId)
        .single(),

      // Badges
      supabaseAdmin
        .from("user_badges")
        .select("badge_id, earned_at")
        .eq("user_id", user.profileId),
    ]);

    return Response.json({
      weekly: aggregateWeekly(weeklyRes.data),
      echappee: echappeeRes.data || [],
      feed: feedRes.data || [],
      stats: statsRes.data,
      badges: badgesRes.data || [],
    });
  } catch (err) {
    return handleApiError(err, "DASHBOARD");
  }
}
```

**Impact** : 5 requêtes HTTP → 1 requête HTTP. 5 DB queries séquentielles → 5 DB queries parallèles.

### 7.2 — Race Points : paralléliser

**Fichier** : `src/app/api/race-points/route.ts`

Si les queries `points` et `races` sont séquentielles, les paralléliser :

```typescript
// AVANT — séquentiel
const { data: points } = await supabaseAdmin...;
const raceIds = points.map(p => p.race_id);
const { data: races } = await supabaseAdmin.from("races").in("id", raceIds);

// APRÈS — Utiliser un JOIN Supabase
const { data: points } = await supabaseAdmin
  .from("race_points")
  .select("id, points, position, total_participants, created_at, races!inner(id, name, date, federation)")
  .eq("user_id", userId)
  .order("created_at", { ascending: false });
// UNE seule requête au lieu de 2
```

---

## CHANTIER 8 — Optimisations diverses

### 8.1 — Prefetch des données au hover sur BottomTabBar

**Fichier** : `src/components/BottomTabBar.tsx`

Ajouter un `onMouseEnter` / `onTouchStart` pour prefetch les données de la page cible :

```typescript
import { useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

const prefetchMap: Record<string, () => void> = {
  "/duels": () => queryClient.prefetchQuery({ queryKey: ["duels", "pending"], queryFn: ... }),
  "/leaderboard": () => queryClient.prefetchQuery({ queryKey: ["leaderboard", ...], queryFn: ... }),
};

// Dans le Link :
<Link
  href={tab.href}
  onMouseEnter={() => prefetchMap[tab.href]?.()}
  onTouchStart={() => prefetchMap[tab.href]?.()}
  // ...
>
```

**Impact** : Les données sont déjà en cache quand l'utilisateur clique → page instantanée.

### 8.2 — `loading.tsx` pour chaque route group

Ajouter des composants `loading.tsx` avec Skeleton dans chaque dossier de page pour que Next.js affiche un skeleton pendant le streaming SSR :

```
src/app/dashboard/loading.tsx   → DashboardSkeleton
src/app/duels/loading.tsx       → DuelsSkeleton
src/app/leaderboard/loading.tsx → LeaderboardSkeleton
src/app/wars/loading.tsx        → WarsSkeleton
src/app/races/loading.tsx       → RacesSkeleton
```

### 8.3 — Supprimer les dépendances inutilisées

Vérifier dans `package.json` si `lucide-react`, `@heroicons/react`, `date-fns` sont réellement utilisés (ils sont dans `optimizePackageImports` mais peut-être pas installés). Supprimer tout ce qui n'est pas utilisé.

### 8.4 — Service Worker pour le cache offline (PWA)

Le `manifest.json` existe déjà. Ajouter un service worker basique pour cacher les assets statiques :

**Fichier** : `public/sw.js`

```javascript
const CACHE_NAME = "velocard-v1";
const STATIC_ASSETS = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("fetch", (event) => {
  // Cache-first pour les assets statiques, network-first pour les API
  if (event.request.url.includes("/_next/static/")) {
    event.respondWith(
      caches.match(event.request).then((r) => r || fetch(event.request))
    );
  }
});
```

---

## ORDRE D'EXÉCUTION

1. **Chantier 1** — N+1 queries (le plus critique, impact serveur)
2. **Chantier 2** — React Query partout (remplace useState/useEffect, ajoute le cache client)
3. **Chantier 3** — Images → next/image (impact LCP direct)
4. **Chantier 4** — Memoization (React.memo, useCallback)
5. **Chantier 5** — Dynamic imports (réduit le bundle initial)
6. **Chantier 7** — Parallel fetches + endpoint dashboard combiné
7. **Chantier 6** — Cache headers API
8. **Chantier 8** — Prefetch, loading.tsx, PWA

---

## CHECKLIST FINALE

- [ ] War service : boucle N+1 → 1 requête batch
- [ ] Monday Update : 8×N queries → 6 queries batch + N updates parallélisés
- [ ] Clubs API : count manuel → count Supabase natif
- [ ] Wars matchmaking : boucle getClubScore → 2 queries batch
- [ ] Race Points : 2 queries séquentielles → 1 JOIN
- [ ] React Query hooks centralisés dans `src/hooks/useApiQueries.ts`
- [ ] LeaderboardPage migré sur React Query (7 useState → 3)
- [ ] DuelsPage migré sur React Query (10 useState → 6, 6 useEffect → 0)
- [ ] Toutes les pages client migrées (wars, clubs, profile, races, echappee)
- [ ] Toutes les `<img>` remplacées par `<Image>` de next/image (5 fichiers)
- [ ] Composant `Avatar` réutilisable créé
- [ ] VeloCard, VeloCard3D, DuelCard, LeaderboardRow, CourseMap wrappés en `React.memo`
- [ ] Handlers wrappés en `useCallback` dans les pages avec listes
- [ ] `useMemo` pour tous les `.filter()/.sort()/.map()` sur tableaux > 20 éléments
- [ ] CourseMap, ElevationProfile, ShareModal, MondayReveal en `dynamic()` import
- [ ] Cache-Control headers ajoutés sur 6+ routes API
- [ ] Endpoint `/api/dashboard` combiné (5 queries parallèles en 1 requête HTTP)
- [ ] Prefetch au hover sur BottomTabBar
- [ ] `loading.tsx` dans chaque route group (5 fichiers)
- [ ] Service worker basique pour assets cache
