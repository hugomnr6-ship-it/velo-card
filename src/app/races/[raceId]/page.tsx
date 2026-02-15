"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import ParticipantRow from "@/components/ParticipantRow";
import ResultRow from "@/components/ResultRow";
import RaceResultsForm from "@/components/RaceResultsForm";
import AnimatedPage from "@/components/AnimatedPage";
import EmptyState from "@/components/EmptyState";
import { AnimatedList, AnimatedListItem } from "@/components/AnimatedList";
import { useToast } from "@/contexts/ToastContext";
import Skeleton from "@/components/Skeleton";
import { IconFlag } from "@/components/icons/VeloIcons";
import type { RaceDetailWithResults } from "@/types";

export default function RaceDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const raceId = params.raceId as string;
  const { toast } = useToast();

  const [race, setRace] = useState<RaceDetailWithResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (session && raceId) fetchRace();
  }, [session, raceId]);

  async function fetchRace() {
    setLoading(true);
    try {
      const res = await fetch(`/api/races/${raceId}`);
      if (res.ok) {
        setRace(await res.json());
      } else {
        router.replace("/races");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/races/${raceId}/join`, { method: "POST" });
      if (!res.ok) throw new Error("Erreur lors de l'inscription");
      toast("Inscription confirmee !", "success");
      await fetchRace();
    } catch (err: any) {
      toast(err.message || "Erreur reseau", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLeave() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/races/${raceId}/leave`, { method: "POST" });
      if (!res.ok) throw new Error("Erreur lors de la desinscription");
      toast("Desinscription effectuee", "info");
      await fetchRace();
    } catch (err: any) {
      toast(err.message || "Erreur reseau", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer cette course ?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/races/${raceId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      toast("Course supprimee", "info");
      router.replace("/races");
    } catch (err: any) {
      toast(err.message || "Erreur reseau", "error");
    } finally {
      setActionLoading(false);
    }
  }

  if (status === "loading" || !session || loading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <Skeleton className="mb-6 h-4 w-32" />
          <Skeleton className="mb-4 h-48 w-full rounded-xl" />
          <Skeleton className="mb-6 h-10 w-32 rounded-lg" />
          <Skeleton className="mb-3 h-4 w-24" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="mb-2 h-14 w-full rounded-xl" />
          ))}
        </div>
      </main>
    );
  }

  if (!race) return null;

  const dateStr = new Date(race.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-2xl">
        <Link
          href="/races"
          className="mb-6 inline-block text-sm text-[#94A3B8] hover:text-white/80"
        >
          &larr; Retour aux courses
        </Link>

        <div className="rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-6">
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-family-title)]">{race.name}</h1>
          <p className="mt-2 text-sm text-[#94A3B8]">{dateStr}</p>
          <p className="mt-1 text-sm text-[#94A3B8]">{race.location}</p>
          {race.description && (
            <p className="mt-3 text-sm text-white/80">{race.description}</p>
          )}

          <div className="mt-4 flex items-center gap-2">
            {race.creator?.avatar_url ? (
              <img
                src={race.creator.avatar_url}
                alt=""
                className="h-5 w-5 rounded-full"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-[#22223A]" />
            )}
            <span className="text-xs text-[#94A3B8]">
              Organise par {race.creator?.username}
            </span>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          {!race.is_participant && !race.is_creator && (
            <button
              onClick={handleJoin}
              disabled={actionLoading}
              className="rounded-lg bg-[#6366F1] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#6366F1]/80 disabled:opacity-50"
            >
              {actionLoading ? "..." : "Je participe"}
            </button>
          )}
          {race.is_participant && !race.is_creator && (
            <button
              onClick={handleLeave}
              disabled={actionLoading}
              className="rounded-lg border border-red-500/50 px-5 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              {actionLoading ? "..." : "Se desinscrire"}
            </button>
          )}
          {race.is_creator && (
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="rounded-lg border border-red-500/50 px-5 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              Supprimer la course
            </button>
          )}
        </div>

        {/* ——— Results Section ——— */}
        {race.results_published && race.results && race.results.length > 0 && (
          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#94A3B8]">
                Resultats ({race.results.length} coureur
                {race.results.length !== 1 ? "s" : ""})
              </h2>
              {race.is_creator && (
                <button
                  onClick={() => setShowEditForm(!showEditForm)}
                  className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-semibold text-[#94A3B8] transition hover:border-[#6366F1]/30 hover:text-white/90"
                >
                  {showEditForm ? "Fermer" : "Modifier les resultats"}
                </button>
              )}
            </div>

            {/* Edit form (inline, toggleable) */}
            {showEditForm && race.is_creator && (
              <div className="mb-4">
                <RaceResultsForm
                  raceId={raceId}
                  existingResults={race.results}
                  existingRaceTime={race.race_time}
                  existingAvgSpeed={race.avg_speed}
                  onPublished={() => {
                    setShowEditForm(false);
                    fetchRace();
                  }}
                />
              </div>
            )}

            {/* Race stats: time & speed */}
            {(race.race_time > 0 || race.avg_speed > 0) && (
              <div className="mb-4 flex flex-wrap gap-4">
                {race.race_time > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#1A1A2E]/80 px-3 py-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#94A3B8]">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="text-xs text-[#94A3B8]">Temps</span>
                    <span className="text-sm font-bold text-white font-[family-name:var(--font-family-data)]">
                      {(() => {
                        const h = Math.floor(race.race_time / 3600);
                        const m = Math.floor((race.race_time % 3600) / 60);
                        const s = race.race_time % 60;
                        if (h > 0) return `${h}h${m.toString().padStart(2, "0")}m${s.toString().padStart(2, "0")}s`;
                        return `${m}m${s.toString().padStart(2, "0")}s`;
                      })()}
                    </span>
                  </div>
                )}
                {race.avg_speed > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#1A1A2E]/80 px-3 py-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#94A3B8]">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    <span className="text-xs text-[#94A3B8]">Vitesse moy.</span>
                    <span className="text-sm font-bold text-white font-[family-name:var(--font-family-data)]">{race.avg_speed} km/h</span>
                  </div>
                )}
              </div>
            )}

            <AnimatedList className="flex flex-col gap-2">
              {race.results.map((r) => (
                <AnimatedListItem key={`result-${r.position}`}>
                  <ResultRow result={r} currentUserId={session.user.id} />
                </AnimatedListItem>
              ))}
            </AnimatedList>

            <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          </div>
        )}

        {/* ——— Results Form (creator only, first time publishing) ——— */}
        {race.is_creator && !race.results_published && (
          <div className="mt-6">
            <RaceResultsForm
              raceId={raceId}
              existingRaceTime={race.race_time}
              existingAvgSpeed={race.avg_speed}
              onPublished={fetchRace}
            />

            <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          </div>
        )}

        {/* ——— Startlist ——— */}
        <div className="mt-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#94A3B8]">
            Startlist ({race.participants.length} participant
            {race.participants.length !== 1 ? "s" : ""})
          </h2>

          {race.participants.length === 0 ? (
            <EmptyState
              icon={<IconFlag size={36} className="text-white/30" />}
              title="Aucun participant"
              description="Sois le premier a t'inscrire !"
            />
          ) : (
            <AnimatedList className="flex flex-col gap-2">
              {race.participants.map((p, i) => (
                <AnimatedListItem key={p.user_id}>
                  <ParticipantRow participant={p} index={i} />
                </AnimatedListItem>
              ))}
            </AnimatedList>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
