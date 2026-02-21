/**
 * Configuration centralisée des gates Free vs Pro.
 * Utilisé côté serveur (API) et côté client (composants).
 *
 * Règle : montrer la feature, flouter/limiter l'accès,
 * afficher un CTA "Passer Pro" contextuel.
 */

export const PRO_GATES = {
  // Stats : Free = toujours visibles (dernière maj lundi), Pro = refresh temps réel
  stats: {
    freeLabel: "Stats mises à jour chaque lundi",
    proLabel: "Stats en temps réel + mini-charts",
    refreshLabel: "Rafraîchir les stats en temps réel",
    freeCanViewStats: () => {
      // Les stats du dernier lundi sont toujours visibles
      return true;
    },
    freeCanRefreshStats: () => {
      // Le refresh mid-week est réservé aux Pro — free uniquement le lundi
      return new Date().getDay() === 1; // 1 = Monday
    },
  },

  // Duels : Free = 1 duel actif max, Pro = illimités
  duels: {
    freeMaxActive: 1,
    proMaxActive: Infinity,
    freeLabel: "1 duel actif maximum",
    proLabel: "Duels illimités",
  },

  // Leaderboard : Free = Top 20, Pro = complet + position exacte
  leaderboard: {
    freeMaxEntries: 20,
    proMaxEntries: Infinity,
    freeLabel: "Top 20 uniquement",
    proLabel: "Classement complet + ta position exacte",
  },

  // Quêtes : Free = 3/jour, Pro = illimitées + double rewards
  quests: {
    freeMaxDaily: 3,
    proMaxDaily: Infinity,
    proRewardMultiplier: 2,
    freeLabel: "3 quêtes par jour",
    proLabel: "Quêtes illimitées + récompenses x2",
  },

  // Share : Free = watermark, Pro = sans
  share: {
    freeHasWatermark: true,
    proHasWatermark: false,
    freeLabel: "Partage avec watermark VeloCard",
    proLabel: "Partage sans watermark",
  },

  // GPX : Free = basique (distance, D+), Pro = complet (climbs, météo, RDI)
  gpx: {
    freeFeatures: ["distance", "elevation_gain"] as string[],
    proFeatures: ["distance", "elevation_gain", "climbs", "weather", "rdi", "hourly_weather"] as string[],
    freeLabel: "Distance + D+ uniquement",
    proLabel: "Analyse complète : cols, météo, RDI",
  },

  // Routes sauvegardées : Free = 3 max, Pro = illimité
  routes: {
    freeMaxSaved: 3,
    proMaxSaved: Infinity,
    freeLabel: "3 parcours sauvegardés maximum",
    proLabel: "Parcours illimités",
  },
} as const;

/**
 * Vérifie si un utilisateur Free peut accéder à une feature.
 * Retourne true si accessible, false si bloqué par le gate.
 */
export function canAccessFeature(
  feature: keyof typeof PRO_GATES,
  isPro: boolean,
): boolean {
  if (isPro) return true;

  switch (feature) {
    case "stats":
      return PRO_GATES.stats.freeCanViewStats();
    default:
      return true; // Les autres features ont des limites, pas un blocage total
  }
}

/**
 * Retourne le message du gate pour une feature donnée.
 */
export function getGateMessage(feature: keyof typeof PRO_GATES): {
  free: string;
  pro: string;
} {
  const gate = PRO_GATES[feature];
  return {
    free: gate.freeLabel,
    pro: gate.proLabel,
  };
}
