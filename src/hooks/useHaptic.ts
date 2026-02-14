"use client";

/**
 * Haptic feedback hook — no-op on web, ready for React Native migration.
 * Uses navigator.vibrate when available (Android Chrome).
 */
type HapticStyle = "light" | "medium" | "heavy" | "success";

const patterns: Record<HapticStyle, number[]> = {
  light: [10],
  medium: [25],
  heavy: [50],
  success: [10, 30, 20],
};

export function useHaptic() {
  function trigger(style: HapticStyle = "light") {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(patterns[style]);
    }
  }

  return { trigger };
}
