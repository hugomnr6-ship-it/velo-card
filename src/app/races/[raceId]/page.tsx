"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import ParticipantRow from "@/components/ParticipantRow";
import type { RaceDetail } from "@/types";

export default function RaceDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const raceId = params.raceId as string;

  const [race, setRace] = useState<RaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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
    await fetch(`/api/races/${raceId}/join`, { method: "POST" });
    await fetchRace();
    setActionLoading(false);
  }

  async function handleLeave() {
    setActionLoading(true);
    await fetch(`/api/races/${raceId}/leave`, { method: "POST" });
    await fetchRace();
    setActionLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Supprimer cette course ?")) return;
    setActionLoading(true);
    await fetch(`/api/races/${raceId}`, { method: "DELETE" });
    router.replace("/races");
  }

  if (status === "loading" || !session || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-neutral-400">Chargement...</p>
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
    <main className="flex min-h-screen flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Back link */}
        <Link
          href="/races"
          className="mb-6 inline-block text-sm text-neutral-500 hover:text-neutral-300"
        >
          ← Retour aux courses
        </Link>

        {/* Race header */}
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-6">
          <h1 className="text-2xl font-bold text-white">{race.name}</h1>
          <p className="mt-2 text-sm text-neutral-400">{dateStr}</p>
          <p className="mt-1 text-sm text-neutral-500">{race.location}</p>
          {race.description && (
            <p className="mt-3 text-sm text-neutral-300">{race.description}</p>
          )}

          <div className="mt-4 flex items-center gap-2">
            {race.creator?.avatar_url ? (
              <img
                src={race.creator.avatar_url}
                alt=""
                className="h-5 w-5 rounded-full"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-neutral-600" />
            )}
            <span className="text-xs text-neutral-500">
              Organisé par {race.creator?.username}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-3">
          {!race.is_participant && !race.is_creator && (
            <button
              onClick={handleJoin}
              disabled={actionLoading}
              className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
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
              {actionLoading ? "..." : "Se désinscrire"}
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

        {/* Startlist */}
        <div className="mt-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-500">
            Startlist ({race.participants.length} participant
            {race.participants.length !== 1 ? "s" : ""})
          </h2>

          {race.participants.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Aucun participant pour le moment.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {race.participants.map((p, i) => (
                <ParticipantRow key={p.user_id} participant={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
