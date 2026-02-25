import { supabaseAdmin } from "@/lib/supabase";

/**
 * Leaderboard service — compliant Strava ToS.
 * Tri uniquement par stats abstraites VeloCard (0-99).
 * Filtre par sharing_consent = true.
 * Ne retourne aucune donnée Strava brute (km, D+, temps).
 */
export async function getWeeklyLeaderboard(region: string, sort: string, limit: number = 100) {
  // Récupérer les profils consentants
  const isGlobal = region.toLowerCase() === "global";
  const isNational = region.toLowerCase() === "france";
  let profileQuery = supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_url, region")
    .eq("sharing_consent", true);

  if (!isGlobal && !isNational) {
    profileQuery = profileQuery.eq("region", region);
  }

  const { data: regionProfiles } = await profileQuery;

  if (!regionProfiles || regionProfiles.length === 0) {
    return [];
  }

  const userIds = regionProfiles.map((p: any) => p.id);

  // Récupérer uniquement les stats abstraites (pas d'activités Strava)
  const { data: allStats } = await supabaseAdmin
    .from("user_stats")
    .select('user_id, pac, "end", mon, val, spr, res, ovr, tier, special_card')
    .in("user_id", userIds);

  const statsMap: Record<string, any> = {};
  for (const s of allStats || []) statsMap[s.user_id] = s;

  // Construire les entrées — uniquement des données abstraites
  const entries = regionProfiles.map((p: any) => {
    const st = statsMap[p.id] || { pac: 0, end: 0, mon: 0, val: 0, spr: 0, res: 0, ovr: 0, tier: "bronze", special_card: null };
    return {
      user_id: p.id,
      username: p.username,
      avatar_url: p.avatar_url,
      region: p.region || null,
      ovr: st.ovr || 0,
      tier: st.tier || "bronze",
      special_card: st.special_card || null,
      // Stats individuelles pour le tri (pas exposées dans LeaderboardEntry mais utilisées pour le sort)
      _pac: st.pac || 0,
      _mon: st.mon || 0,
      _val: st.val || 0,
      _spr: st.spr || 0,
      _end: st.end || 0,
      _res: st.res || 0,
    };
  });

  // Tri par stats abstraites uniquement
  const statSorts = ["pac", "mon", "val", "spr", "end", "res"];
  if (statSorts.includes(sort)) {
    entries.sort((a: any, b: any) => (b[`_${sort}`] || 0) - (a[`_${sort}`] || 0));
  } else {
    // Default: tri par OVR
    entries.sort((a: any, b: any) => b.ovr - a.ovr);
  }

  // Pagination + nettoyage des champs internes
  const capped = entries.slice(0, limit);
  return capped.map((e: any, i: number) => {
    const { _pac, _mon, _val, _spr, _end, _res, ...clean } = e;
    return { rank: i + 1, ...clean };
  });
}
