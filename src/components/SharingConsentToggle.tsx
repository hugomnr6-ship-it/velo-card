"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SharingConsentToggleProps {
  initialConsent: boolean;
  onConsentChange?: (consent: boolean) => void;
}

export default function SharingConsentToggle({
  initialConsent,
  onConsentChange,
}: SharingConsentToggleProps) {
  const [consent, setConsent] = useState(initialConsent);
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (sharing_consent: boolean) => {
      const res = await fetch("/api/privacy/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sharing_consent }),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      return res.json();
    },
    onMutate: async (newConsent) => {
      // Optimistic update
      setConsent(newConsent);
      onConsentChange?.(newConsent);
    },
    onError: () => {
      // Rollback
      setConsent(!consent);
      onConsentChange?.(!consent);
    },
    onSuccess: () => {
      // Invalider les caches liés
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const handleToggle = () => {
    if (consent) {
      // Désactivation → modale de confirmation
      setShowConfirm(true);
    } else {
      // Activation directe
      mutation.mutate(true);
    }
  };

  const confirmDisable = () => {
    setShowConfirm(false);
    mutation.mutate(false);
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleToggle}
        disabled={mutation.isPending}
        className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-[#111827] p-4"
      >
        <div className="text-left">
          <p className="text-sm font-semibold text-white">
            Partager mes stats VeloCard avec la communauté
          </p>
          <p className="mt-1 text-xs text-[#94A3B8]">
            Vos scores VeloCard (PAC, MON, etc.) seront visibles dans les classements, duels et profils publics.
            Vos données Strava brutes (km, temps, vitesse) ne sont jamais partagées.
          </p>
        </div>
        <div
          className={`relative ml-4 h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
            consent ? "bg-[#00F5D4]" : "bg-[#374151]"
          }`}
        >
          <div
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              consent ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </div>
      </button>

      {/* Modale de confirmation pour la désactivation */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1A1A2E] p-6">
            <h3 className="text-lg font-bold text-white">Désactiver le partage ?</h3>
            <p className="mt-2 text-sm text-[#94A3B8]">
              Vous serez retiré(e) des classements et vos stats ne seront plus visibles par les autres utilisateurs. Continuer ?
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white"
              >
                Annuler
              </button>
              <button
                onClick={confirmDisable}
                className="flex-1 rounded-xl bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400"
              >
                Désactiver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
