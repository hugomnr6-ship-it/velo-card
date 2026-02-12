"use client";

import Link from "next/link";
import type { RaceWithCreator } from "@/types";

interface RaceCardProps {
  race: RaceWithCreator;
}

export default function RaceCard({ race }: RaceCardProps) {
  const dateStr = new Date(race.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Link
      href={`/races/${race.id}`}
      className="block rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-4 transition hover:border-neutral-500 hover:bg-neutral-700/50"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-white">{race.name}</p>
          <p className="mt-1 text-sm text-neutral-400">{dateStr}</p>
          <p className="mt-0.5 text-sm text-neutral-500">{race.location}</p>
        </div>
        <span className="rounded-full bg-neutral-700/50 px-2.5 py-0.5 text-xs text-neutral-300">
          {race.participant_count} participant
          {race.participant_count !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
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
          {race.creator?.username}
        </span>
      </div>
    </Link>
  );
}
