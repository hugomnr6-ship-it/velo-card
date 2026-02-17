import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY manquant");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
  typescript: true,
});

// Plans Pro
export const PLANS = {
  FREE: "free",
  PRO_MONTHLY: {
    id: "pro_monthly",
    name: "VeloCard Pro",
    price: 4.99,
    interval: "month" as const,
    priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    features: [
      "Duels illimités",
      "Cartes spéciales (TOTW, IF, Légende)",
      "Stats avancées (FTP, puissance)",
      "Historique 52 semaines",
      "Customisation de carte complète",
      "Classement mondial",
      "Export PDF de stats",
      "Badge Pro exclusif",
    ],
  },
  PRO_YEARLY: {
    id: "pro_yearly",
    name: "VeloCard Pro (Annuel)",
    price: 39.99,
    interval: "year" as const,
    priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
    features: [], // mêmes features, prix réduit
    savings: "33%",
  },
} as const;

// Packs de VeloCoins achetables
export const COIN_PACKS = [
  {
    id: "coins_500",
    coins: 500,
    price: 1.99,
    priceId: process.env.STRIPE_COINS_500_PRICE_ID!,
    label: "500 VeloCoins",
    popular: false,
  },
  {
    id: "coins_1200",
    coins: 1200,
    price: 4.99,
    priceId: process.env.STRIPE_COINS_1200_PRICE_ID!,
    label: "1 200 VeloCoins",
    bonus: "20% bonus",
    popular: true,
  },
  {
    id: "coins_3000",
    coins: 3000,
    price: 9.99,
    priceId: process.env.STRIPE_COINS_3000_PRICE_ID!,
    label: "3 000 VeloCoins",
    bonus: "50% bonus",
    popular: false,
  },
] as const;
