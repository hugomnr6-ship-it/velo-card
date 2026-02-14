import type { CardTier } from "@/types";

/**
 * Compute the GEN score for a race result.
 *
 * GEN = average of:
 *   - Position score: 1st=99, last=30, linear interpolation
 *   - Time score: (bestTime / finishTime) * 99
 *
 * Clamped to 0–99.
 */
export function computeGenScore(
  position: number,
  finishTime: number,
  totalRiders: number,
  bestTime: number,
): number {
  // Position score: 1st gets 99, last gets 30
  const positionScore =
    totalRiders <= 1
      ? 99
      : 99 - ((position - 1) / (totalRiders - 1)) * (99 - 30);

  // Time score: ratio of best time to this rider's time
  const timeScore =
    finishTime > 0 ? (bestTime / finishTime) * 99 : 0;

  // GEN = average, clamped 0–99
  const gen = Math.round((positionScore + timeScore) / 2);
  return Math.max(0, Math.min(99, gen));
}

/**
 * Map a GEN score to a card tier.
 * Same thresholds as VeloCard:
 *   - < 50  → bronze
 *   - < 65  → argent
 *   - < 80  → platine
 *   - < 90  → diamant
 *   - >= 90 → legende
 */
export function getGhostTier(genScore: number): CardTier {
  if (genScore >= 90) return "legende";
  if (genScore >= 80) return "diamant";
  if (genScore >= 65) return "platine";
  if (genScore >= 50) return "argent";
  return "bronze";
}

/**
 * Generate a random claim token (12 alphanumeric characters).
 */
export function generateClaimToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
