"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { m } from "framer-motion";
import AnimatedPage from "@/components/AnimatedPage";
import { useSubscription, useCheckout, useBillingPortal } from "@/hooks/useSubscription";
import { useToast } from "@/contexts/ToastContext";

const features = [
  { name: "Carte de base & stats hebdo", free: true, pro: true },
  { name: "Duels actifs", free: "1 actif", pro: "Illimités" },
  { name: "Clubs", free: "1 club", pro: "5 clubs" },
  { name: "Leaderboard", free: "Top 20", pro: "Complet + position" },
  { name: "Quêtes quotidiennes", free: "3/jour", pro: "Illimitées + x2" },
  { name: "Historique stats", free: "4 semaines", pro: "52 semaines" },
  { name: "Analyse GPX", free: "Distance + D+", pro: "Complète" },
  { name: "Partage de carte", free: "Avec watermark", pro: "Sans watermark" },
  { name: "Cartes spéciales (TOTW, IF, Légende)", free: false, pro: true },
  { name: "Stats avancées (FTP, puissance, zones)", free: false, pro: true },
  { name: "Customisation de carte complète", free: false, pro: true },
  { name: "Badge Pro exclusif", free: false, pro: true },
  { name: "Support prioritaire", free: false, pro: true },
];

export default function PricingPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { data: subscription } = useSubscription();
  const checkout = useCheckout();
  const billingPortal = useBillingPortal();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast("Bienvenue dans VeloCard Pro !", "success");
    } else if (searchParams.get("canceled") === "true") {
      toast("Paiement annulé", "info");
    }
  }, [searchParams, toast]);

  const isPro = subscription?.isPro;

  const handleSubscribe = (plan: "pro_monthly" | "pro_yearly") => {
    if (status !== "authenticated") {
      router.push("/");
      return;
    }
    checkout.mutate({ plan });
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white">
        <div className="max-w-5xl mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Passe au niveau <span className="text-yellow-400">Pro</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Débloque tout le potentiel de ta VeloCard. 7 jours d&apos;essai gratuit, annule quand tu veux.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex justify-center items-center gap-4 mb-12">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-4 py-2 rounded-lg transition ${billing === "monthly" ? "bg-indigo-600 text-white" : "text-gray-400"}`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-4 py-2 rounded-lg transition ${billing === "yearly" ? "bg-indigo-600 text-white" : "text-gray-400"}`}
            >
              Annuel <span className="text-green-400 text-sm ml-1">-33%</span>
            </button>
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/70 border border-gray-600 rounded-2xl p-8"
            >
              <h3 className="text-xl font-semibold text-white mb-2">Free</h3>
              <div className="text-3xl font-bold text-white mb-1">0&euro;</div>
              <p className="text-gray-300 text-sm mb-6">Pour toujours</p>
              <button
                disabled
                className="w-full py-3 rounded-xl bg-gray-700 text-gray-400 cursor-not-allowed"
              >
                Plan actuel
              </button>
            </m.div>

            {/* Pro */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-2 border-indigo-500 rounded-2xl p-8 relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                POPULAIRE
              </div>
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <div className="text-3xl font-bold text-white mb-1">
                {billing === "monthly" ? "4,99\u20AC" : "39,99\u20AC"}
                <span className="text-base font-normal text-gray-300">
                  /{billing === "monthly" ? "mois" : "an"}
                </span>
              </div>
              <p className="text-gray-300 text-sm mb-6">
                {billing === "yearly" ? "Soit 3,33\u20AC/mois \u2014 économise 33%" : "7 jours d'essai gratuit"}
              </p>

              {isPro ? (
                <button
                  onClick={() => billingPortal.mutate()}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-semibold"
                >
                  Gérer mon abonnement
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(billing === "monthly" ? "pro_monthly" : "pro_yearly")}
                  disabled={checkout.isPending}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-semibold disabled:opacity-50"
                >
                  {checkout.isPending ? "Redirection..." : "Commencer l'essai gratuit"}
                </button>
              )}
            </m.div>
          </div>

          {/* Feature comparison */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Comparaison détaillée</h2>
            <div className="bg-gray-800/50 rounded-2xl overflow-hidden border border-gray-700">
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-700/50 font-semibold text-sm">
                <div className="text-white">Feature</div>
                <div className="text-center text-white">Free</div>
                <div className="text-center text-indigo-300">Pro</div>
              </div>
              {features.map((f, i) => (
                <div key={i} className="grid grid-cols-3 gap-4 p-4 border-t border-gray-700/50 text-sm">
                  <div className="text-white/90">{f.name}</div>
                  <div className="text-center">
                    {f.free === true ? (
                      <span className="text-green-400" aria-label="Inclus">&#10003;</span>
                    ) : f.free === false ? (
                      <span className="text-red-400" aria-label="Non inclus">&#10007;</span>
                    ) : (
                      <span className="text-gray-400">{f.free}</span>
                    )}
                  </div>
                  <div className="text-center">
                    {f.pro === true ? (
                      <span className="text-green-400" aria-label="Inclus">&#10003;</span>
                    ) : f.pro === false ? (
                      <span className="text-red-400" aria-label="Non inclus">&#10007;</span>
                    ) : (
                      <span className="text-indigo-300">{f.pro}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Questions fréquentes</h2>
            {[
              {
                q: "Est-ce que je peux annuler à tout moment ?",
                a: "Oui, tu peux annuler ton abonnement à tout moment depuis les paramètres. Tu gardes l'accès Pro jusqu'à la fin de ta période en cours.",
              },
              {
                q: "Comment fonctionne l'essai gratuit ?",
                a: "Tu as 7 jours d'essai gratuit. Tu ne seras pas débité pendant cette période. Tu peux annuler avant la fin de l'essai sans être facturé.",
              },
              {
                q: "Mes VeloCoins sont-ils affectés ?",
                a: "Non ! Tes VeloCoins restent les mêmes que tu sois Free ou Pro. Le Pro débloque des features, pas des coins.",
              },
              {
                q: "Puis-je passer du mensuel à l'annuel ?",
                a: "Oui, via le portail de facturation. Le changement est proratisé automatiquement.",
              },
            ].map((faq, i) => (
              <details key={i} className="mb-4 bg-gray-800/30 rounded-xl p-4 cursor-pointer group">
                <summary className="font-semibold text-gray-200 list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-gray-500 group-open:rotate-180 transition" aria-hidden="true">&#9660;</span>
                </summary>
                <p className="mt-3 text-gray-400 text-sm">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
