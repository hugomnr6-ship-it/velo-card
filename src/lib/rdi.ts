import type { RouteSummary, WeatherData, RdiResult, RdiLabel } from "@/types";

/**
 * Route Difficulty Index (RDI) — v2
 *
 * 3 composantes additives avec courbes √ (saturent lentement) :
 *   • D+       → max 7 pts  (70 %)  — facteur dominant
 *   • Distance → max 2.5 pts (25 %) — secondaire
 *   • Vent     → max 0.5 pt  (5 %)  — bonus léger
 *
 * Référence 10/10 : étape de haute montagne du Tour de France
 *   ~180 km, ~4 500 m D+, vent fort ≈ 10
 *
 * Score : 0-10, arrondi au 0.5 le plus proche
 */
export function computeRdi(
  summary: RouteSummary,
  weather: WeatherData | null,
): RdiResult {
  // ── D+ : 0-7 pts (référence = 4500 m) ──
  const dplusNorm = Math.min(1, summary.totalElevationGain / 4500);
  const dplusScore = 7 * Math.sqrt(dplusNorm);

  // ── Distance : 0-2.5 pts (référence = 200 km) ──
  const distNorm = Math.min(1, summary.totalDistanceKm / 200);
  const distScore = 2.5 * Math.sqrt(distNorm);

  // ── Vent : 0-0.5 pt (bonus additif, référence = 50 km/h) ──
  const windSpeed = weather?.windSpeedKmh ?? 0;
  const windNorm = Math.min(1, windSpeed / 50);
  const windScore = 0.5 * Math.sqrt(windNorm);

  const rawScore = dplusScore + distScore + windScore;

  // Arrondi au 0.5 le plus proche, plafonné à 10
  const score = Math.min(Math.round(rawScore * 2) / 2, 10);

  return {
    score,
    label: getRdiLabel(score),
  };
}

function getRdiLabel(score: number): RdiLabel {
  if (score <= 3) return "Facile";
  if (score <= 6) return "Modéré";
  if (score <= 8) return "Difficile";
  return "Extrême";
}
