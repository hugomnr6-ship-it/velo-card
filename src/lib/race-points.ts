import type { Federation } from "@/types";

/**
 * Compute race points based on position, total participants, and federation.
 * Formula: points = round((1 - (position - 1) / total) * 100 * coeff)
 * Coefficients: FFC=1.2, UFOLEP=1.0, FSGT=0.8, OTHER=0.7
 */

const FED_COEFFICIENTS: Record<Federation, number> = {
  FFC: 1.2,
  UFOLEP: 1.0,
  FSGT: 0.8,
  OTHER: 0.7,
};

export function computeRacePoints(
  position: number,
  totalParticipants: number,
  federation: Federation = "OTHER",
): number {
  if (totalParticipants <= 0 || position <= 0) return 0;
  const coeff = FED_COEFFICIENTS[federation] || 0.7;
  const raw = (1 - (position - 1) / totalParticipants) * 100 * coeff;
  return Math.round(Math.max(0, raw));
}

/**
 * Get bonus effects for card stats based on race results.
 */
export function getRaceBonus(position: number, totalParticipants: number): {
  resBoost: number;
  ovrBoost: number;
  badge: string | null;
} {
  if (position === 1) {
    return { resBoost: 5, ovrBoost: 3, badge: "race_winner" };
  }
  if (position <= 3) {
    return { resBoost: 3, ovrBoost: 2, badge: "race_podium" };
  }
  if (position <= 10) {
    return { resBoost: 2, ovrBoost: 1, badge: null };
  }
  return { resBoost: 0, ovrBoost: 0, badge: null };
}
