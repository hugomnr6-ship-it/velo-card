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
  race_id: string | null;
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
          tier={ghost.tier}
          raceName={ghost.race_name}
          position={ghost.position ?? undefined}
        />
      </div>

      {/* Context info — position, temps, lien course */}
      <div className="flex flex-col items-center gap-3">
        {/* Position & temps en grand */}
        {ghost.position && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center rounded-xl border border-white/[0.08] bg-[#1A1A2E]/60 px-5 py-3">
              <span className="text-2xl font-black text-white">{formatPosition(ghost.position)}</span>
              <span className="text-[10px] font-bold uppercase text-[#64748B]">Position</span>
            </div>
            {ghost.finish_time && ghost.finish_time > 0 && (
              <div className="flex flex-col items-center rounded-xl border border-white/[0.08] bg-[#1A1A2E]/60 px-5 py-3">
                <span className="text-2xl font-black text-white">{formatTime(ghost.finish_time)}</span>
                <span className="text-[10px] font-bold uppercase text-[#64748B]">Temps</span>
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-[#94A3B8]">
          {ghost.race_name}
          {ghost.race_date && (
            <span className="text-[#64748B]">
              {" "}— {new Date(ghost.race_date).toLocaleDateString("fr-FR")}
            </span>
          )}
        </p>

        {/* Lien vers la course */}
        {ghost.race_id && (
          <Link
            href={`/races/${ghost.race_id}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#6366F1] transition hover:text-[#818CF8]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Voir la course
          </Link>
        )}

        <p className="text-[10px] text-[#475569]">
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
