import { supabaseAdmin } from "@/lib/supabase";
import type { PublicProfile, CardTier, SpecialCardType } from "@/types";

/**
 * Ce fichier centralise TOUTE la logique de filtrage par consentement.
 * Chaque endpoint qui retourne des données d'autres users DOIT utiliser ces helpers.
 */

/**
 * Liste des champs Strava bruts qui ne doivent JAMAIS être retournés pour d'autres users.
 * Si un endpoint retourne ces champs pour un user qui n'est pas l'authentifié, c'est une violation.
 */
export const STRAVA_RAW_FIELDS = [
  "distance", "moving_time", "elapsed_time", "total_elevation_gain",
  "average_speed", "max_speed", "weighted_average_watts",
  "weekly_km", "weekly_dplus", "weekly_rides", "weekly_time",
  "totalKm", "totalDplus", "totalRides", "totalTime",
] as const;

/**
 * Champs VeloCard abstraits qui PEUVENT être partagés (avec consentement).
 * Ce sont des scores de jeu calculés, pas des données Strava directes.
 */
export const SHAREABLE_FIELDS = [
  "pac", "mon", "val", "spr", "end", "res", "ovr",
  "tier", "special_card", "active_weeks_streak",
  "username", "avatar_url", "region", "club_name",
] as const;

/**
 * Sanitize un profil d'un autre user en retirant les données Strava brutes.
 * Ne garde que les stats abstraites VeloCard.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizePublicProfile(profile: any): PublicProfile {
  return {
    id: profile.id,
    username: profile.username,
    avatar_url: profile.avatar_url || null,
    region: profile.region || null,
    club_name: profile.club_name || null,
    // Stats abstraites (scores de jeu 0-99)
    pac: profile.pac || 0,
    mon: profile.mon || 0,
    val: profile.val || 0,
    spr: profile.spr || 0,
    end: profile.end || 0,
    res: profile.res || 0,
    ovr: profile.ovr || 0,
    tier: (profile.tier || "bronze") as CardTier,
    special_card: (profile.special_card || null) as SpecialCardType | null,
    active_weeks_streak: profile.active_weeks_streak || 0,
  };
}

/**
 * Vérifie si un user a donné son consentement de partage.
 * Utiliser pour les vérifications ponctuelles (ex: profil individuel).
 */
export async function hasConsent(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("sharing_consent")
    .eq("id", userId)
    .single();
  return data?.sharing_consent === true;
}
