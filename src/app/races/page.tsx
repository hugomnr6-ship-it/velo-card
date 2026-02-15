"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CreateRaceForm from "@/components/CreateRaceForm";
import RaceCard from "@/components/RaceCard";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { AnimatedList, AnimatedListItem } from "@/components/AnimatedList";
import { RacesSkeleton } from "@/components/Skeleton";
import Skeleton from "@/components/Skeleton";
import { FlagIcon } from "@/components/icons/TabIcons";
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
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <RacesSkeleton />
      </main>
    );
  }

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-2xl">
        <PageHeader icon={<FlagIcon size={28} />} title="Courses" subtitle="Organise et participe" />

        <CreateRaceForm onCreated={fetchRaces} />

        <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#94A3B8]">
          Courses a venir
        </h2>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : races.length === 0 ? (
          <EmptyState
            icon={<FlagIcon size={48} />}
            title="Aucune course"
            description="Aucune course a venir. Cree la premiere !"
          />
        ) : (
          <AnimatedList className="flex flex-col gap-3">
            {races.map((race) => (
              <AnimatedListItem key={race.id}>
                <RaceCard race={race} />
              </AnimatedListItem>
            ))}
          </AnimatedList>
        )}
      </div>
    </AnimatedPage>
  );
}
