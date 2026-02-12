import type { RouteSummary, WeatherData, RdiResult, RdiLabel } from "@/types";

/**
 * Compute the Route Difficulty Index (RDI)
 * Formula: base = (distance_km × D+) / 1000
 * Wind factor: 1 + (windSpeed / 100)
 * Score: capped at 100
 */
export function computeRdi(
  summary: RouteSummary,
  weather: WeatherData | null,
): RdiResult {
  const base =
    (summary.totalDistanceKm * summary.totalElevationGain) / 1000;

  const windFactor = weather ? 1 + weather.windSpeedKmh / 100 : 1;

  const rawScore = base * windFactor;

  // Scale: 280 ≈ 140km with 2000m D+ → score 100
  const score = Math.round(Math.min((rawScore / 280) * 100, 100));

  return {
    score,
    label: getRdiLabel(score),
  };
}

function getRdiLabel(score: number): RdiLabel {
  if (score <= 30) return "Facile";
  if (score <= 60) return "Modéré";
  if (score <= 80) return "Difficile";
  return "Extrême";
}
