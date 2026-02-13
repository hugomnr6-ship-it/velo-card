"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CreateRaceForm from "@/components/CreateRaceForm";
import RaceCard from "@/components/RaceCard";
import type { RaceWithCreator } from "@/types";

export default function RacesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [races, setRaces] = useState<RaceWithCreator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (session) fetchRaces();
  }, [session]);

  async function fetchRaces() {
    setLoading(true);
    try {
      const res = await fetch("/api/races");
      if (res.ok) {
        const data = await res.json();
        setRaces(data);
      }
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-neutral-400">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">Courses</h1>
        </div>

        {/* Create form */}
        <CreateRaceForm onCreated={fetchRaces} />

        {/* Divider */}
        <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />

        {/* Race list */}
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-500">
          Courses à venir
        </h2>

        {loading ? (
          <p className="text-sm text-neutral-400">Chargement...</p>
        ) : races.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Aucune course à venir. Crée la première !
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {races.map((race) => (
              <RaceCard key={race.id} race={race} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
