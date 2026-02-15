"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import GhostCard from "@/components/GhostCard";
import { IconCelebration } from "@/components/icons/VeloIcons";
import type { CardTier } from "@/types";

interface GhostData {
  rider_name: string;
  gen_score: number;
  tier: CardTier;
  race_name: string;
  race_date: string | null;
  position: number | null;
  finish_time: number | null;
  is_claimed: boolean;
  claimed_by: string | null;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${m.toString().padStart(2, "0")}m${s.toString().padStart(2, "0")}s`;
  return `${m}m${s.toString().padStart(2, "0")}s`;
}

function formatPosition(pos: number): string {
  if (pos === 1) return "1er";
  return `${pos}eme`;
}

export default function GhostPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const claimToken = params.claimToken as string;
  const [ghost, setGhost] = useState<GhostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    async function fetchGhost() {
      try {
        const res = await fetch(`/api/ghost/${claimToken}`);
        if (res.ok) {
          setGhost(await res.json());
        } else {
          setError("Fantome introuvable");
        }
      } catch {
        setError("Erreur reseau");
      } finally {
        setLoading(false);
      }
    }
    if (claimToken) fetchGhost();
  }, [claimToken]);

  async function handleClaim() {
    if (session) {
      // Already logged in — claim directly
      setClaiming(true);
      try {
        const res = await fetch("/api/ghost/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claimToken }),
        });
        if (res.ok) {
          router.push(`/ghost/${claimToken}/claim?success=1`);
        } else {
          const data = await res.json();
          setError(data.error || "Erreur lors de la reclamation");
        }
      } catch {
        setError("Erreur reseau");
      } finally {
        setClaiming(false);
      }
    } else {
      // Not logged in — redirect to Strava OAuth
      signIn("strava", { callbackUrl: `/ghost/${claimToken}/claim` });
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black p-4">
        <div className="h-[711px] w-[400px] animate-pulse rounded-2xl bg-[#1A1A2E]/60" />
      </main>
    );
  }

  if (error || !ghost) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black p-4">
        <div className="text-center">
          <p className="text-lg font-bold text-white">
            {error || "Fantome introuvable"}
          </p>
          <p className="mt-2 text-sm text-[#94A3B8]">
            Ce lien est peut-etre invalide ou expire.
          </p>
          <Link
            href="/races"
            className="mt-4 inline-block text-sm text-[#94A3B8] hover:text-white"
          >
            &larr; Retour aux courses
          </Link>
        </div>
      </main>
    );
  }

  if (ghost.is_claimed) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black p-4">
        <div className="text-center">
          <div className="mb-4 flex justify-center"><IconCelebration size={48} className="text-[#FFD700]" /></div>
          <p className="text-lg font-bold text-white">
            Carte deja reclamee !
          </p>
          <p className="mt-2 text-sm text-[#94A3B8]">
            {ghost.rider_name} a deja reclame sa carte VeloCard.
          </p>
          <div className="mt-4 flex flex-col items-center gap-3">
            {ghost.claimed_by && (
              <a
                href={`/card/${ghost.claimed_by}`}
                className="inline-block rounded-lg bg-[#6366F1] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6366F1]/80"
              >
                Voir sa carte
              </a>
            )}
            <Link
              href="/races"
              className="text-sm text-[#94A3B8] hover:text-white"
            >
              &larr; Retour aux courses
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black px-4 py-12">
      {/* Back button */}
      <Link
        href="/races"
        className="absolute left-4 top-4 text-sm text-[#94A3B8] hover:text-white/80"
      >
        &larr; Retour
      </Link>

      {/* Ghost Card */}
      <div className="scale-[0.85] sm:scale-100">
        <GhostCard
          riderName={ghost.rider_name}
          genScore={ghost.gen_score}
          tier={ghost.tier}
          raceName={ghost.race_name}
          position={ghost.position ?? undefined}
        />
      </div>

      {/* Context info */}
      <div className="text-center">
        {ghost.position && (
          <p className="text-sm font-semibold text-white/70">
            {formatPosition(ghost.position)} au{" "}
            <span className="text-white">{ghost.race_name}</span>
            {ghost.finish_time && (
              <span className="text-white/50">
                {" "}
                — {formatTime(ghost.finish_time)}
              </span>
            )}
          </p>
        )}
        <p className="mt-2 text-xs text-[#94A3B8]">
          Score GEN calcule a partir du classement et du temps
        </p>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleClaim}
        disabled={claiming || authStatus === "loading"}
        className="group relative overflow-hidden rounded-xl bg-[#6366F1] px-8 py-4 text-base font-bold text-white transition hover:scale-105 hover:shadow-[0_0_30px_rgba(108,92,231,0.3)] disabled:opacity-50"
      >
        <span className="relative z-10">
          {claiming
            ? "Reclamation..."
            : session
              ? "C'est moi ! Reclamer cette carte"
              : "C'est toi ? Connecte-toi avec Strava"}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-[#fc4c02] to-[#ff6f3c] opacity-0 transition-opacity group-hover:opacity-100" />
        <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
          {claiming
            ? "Reclamation..."
            : session
              ? "C'est moi ! Reclamer cette carte"
              : "C'est toi ? Connecte-toi avec Strava"}
        </span>
      </button>

      <p className="max-w-sm text-center text-xs leading-relaxed text-[#475569]">
        {session
          ? "Clique pour associer cette carte a ton profil VeloCard."
          : "Connecte-toi avec Strava pour reclamer ta carte et debloquer tes stats personnalisees."}
      </p>
    </main>
  );
}
