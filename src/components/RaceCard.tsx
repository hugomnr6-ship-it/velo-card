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
      className="block rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-4 transition hover:border-[#6366F1]/30 hover:bg-[#22223A]/60"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-white">{race.name}</p>
          <p className="mt-1 text-sm text-[#94A3B8]">{dateStr}</p>
          <p className="mt-0.5 text-sm text-[#94A3B8]">{race.location}</p>
        </div>
        <span className="rounded-full bg-[#22223A]/60 px-2.5 py-0.5 text-xs text-white/80">
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
          <div className="h-5 w-5 rounded-full bg-[#22223A]" />
        )}
        <span className="text-xs text-[#94A3B8]">
          {race.creator?.username}
        </span>
      </div>
    </Link>
  );
}
