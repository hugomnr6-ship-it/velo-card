"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { IconCelebration, IconInfo } from "@/components/icons/VeloIcons";

export default function GhostClaimPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimToken = params.claimToken as string;

  // If redirected from ghost page after direct claim
  const alreadySuccess = searchParams.get("success") === "1";

  const [claiming, setClaiming] = useState(false);
  const [success, setSuccess] = useState(alreadySuccess);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/ghost/${claimToken}`);
    }
  }, [status, router, claimToken]);

  // Auto-claim when arriving from OAuth redirect (not already claimed)
  useEffect(() => {
    if (session && claimToken && !claiming && !success && !error && !alreadySuccess) {
      claimGhost();
    }
  }, [session, claimToken]);

  async function claimGhost() {
    setClaiming(true);
    try {
      const res = await fetch("/api/ghost/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimToken }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de la reclamation");
      }
    } catch {
      setError("Erreur reseau");
    } finally {
      setClaiming(false);
    }
  }

  if (status === "loading" || claiming) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black p-4">
        <div role="status" aria-label="Chargement" className="h-16 w-16 animate-spin rounded-full border-4 border-white/[0.08] border-t-white" />
        <p className="text-sm text-[#94A3B8]">
          Reclamation en cours...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black p-4">
        <div className="text-center">
          <div className="mb-4 flex justify-center"><IconInfo size={48} className="text-white/30" /></div>
          <p className="text-lg font-bold text-white">Oups !</p>
          <p className="mt-2 text-sm text-[#94A3B8]">{error}</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg bg-[#6366F1] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6366F1]/80"
          >
            Retour au dashboard
          </button>
          <Link
            href={`/ghost/${claimToken}`}
            className="text-sm text-[#94A3B8] hover:text-white"
          >
            &larr; Retour a la carte
          </Link>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black p-4">
        <div className="text-center">
          <div className="mb-4 flex justify-center"><IconCelebration size={56} className="text-[#FFD700]" /></div>
          <h1 className="text-2xl font-bold text-white">
            Carte reclamee !
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#94A3B8]">
            Ta Ghost Card a ete convertie en vraie carte VeloCard.
            Synchronise tes activites Strava pour debloquer toutes tes stats !
          </p>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-xl bg-[#6366F1] px-8 py-3.5 text-base font-bold text-white transition hover:scale-105 hover:bg-[#6366F1]/80"
        >
          Voir mon dashboard
        </button>
      </main>
    );
  }

  return null;
}
