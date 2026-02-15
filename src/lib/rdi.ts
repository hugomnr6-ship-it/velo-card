import type { RouteSummary, WeatherData, RdiResult, RdiLabel } from "@/types";

/**
 * Compute the Route Difficulty Index (RDI)
 * Formula: [(D+(m) / 300) + (Distance(km) / 50)] × Coefficient Météo
 * Score: 0-10, arrondi au 0.5 près
 */
export function computeRdi(
  summary: RouteSummary,
  weather: WeatherData | null,
): RdiResult {
  const base =
    summary.totalElevationGain / 300 + summary.totalDistanceKm / 50;

  const windFactor = weather ? 1 + weather.windSpeedKmh / 100 : 1;

  const rawScore = base * windFactor;

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
