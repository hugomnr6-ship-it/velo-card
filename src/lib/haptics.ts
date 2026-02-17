/**
 * Haptic feedback patterns pour les actions de gamification.
 * Utilise l'API Vibration (mobile uniquement).
 * Silencieux si non supporté.
 */
export function hapticLight() {
  if ("vibrate" in navigator) navigator.vibrate(5);
}

export function hapticMedium() {
  if ("vibrate" in navigator) navigator.vibrate(15);
}

export function hapticHeavy() {
  if ("vibrate" in navigator) navigator.vibrate([20, 50, 20]);
}

export function hapticSuccess() {
  if ("vibrate" in navigator) navigator.vibrate([10, 30, 10, 30, 10]);
}

export function hapticError() {
  if ("vibrate" in navigator) navigator.vibrate([50, 100, 50]);
}
