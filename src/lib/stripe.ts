import Stripe from "stripe";

// Re-export client-safe constants so server-side code can keep importing from here
export { PLANS, COIN_PACKS } from "./stripe-constants";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY manquant");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
  typescript: true,
});
