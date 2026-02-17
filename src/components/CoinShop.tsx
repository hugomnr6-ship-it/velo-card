"use client";

import { m } from "framer-motion";
import { useCoinsCheckout } from "@/hooks/useSubscription";
import { COIN_PACKS } from "@/lib/stripe";

export default function CoinShop() {
  const buyCoins = useCoinsCheckout();

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4 text-white">Acheter des VeloCoins</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {COIN_PACKS.map((pack) => (
          <m.button
            key={pack.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => buyCoins.mutate({ coinPackId: pack.id })}
            disabled={buyCoins.isPending}
            className={`relative p-6 rounded-2xl border text-center transition
              ${pack.popular
                ? "bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border-yellow-500/50"
                : "bg-gray-800/50 border-gray-700 hover:border-gray-600"
              } disabled:opacity-50`}
          >
            {pack.popular && (
              <div className="absolute -top-2 right-4 bg-yellow-500 text-black text-xs font-bold px-3 py-0.5 rounded-full">
                POPULAIRE
              </div>
            )}
            <div className="text-3xl mb-2" aria-hidden="true">&#x1F48E;</div>
            <div className="text-xl font-bold text-white">{pack.label}</div>
            {"bonus" in pack && pack.bonus && (
              <div className="text-green-400 text-sm mt-1">+{pack.bonus}</div>
            )}
            <div className="text-2xl font-bold text-indigo-400 mt-3">{pack.price}&euro;</div>
          </m.button>
        ))}
      </div>
      <p className="text-gray-500 text-xs mt-3 text-center">
        Paiement sécurisé par Stripe. Livraison instantanée des VeloCoins.
      </p>
    </div>
  );
}
