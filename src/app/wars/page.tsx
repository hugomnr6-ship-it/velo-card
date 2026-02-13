"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { WarDashboard } from "@/types";
import WarMatchupHeader from "@/components/WarMatchupHeader";
import WarTowerBar from "@/components/WarTowerBar";
import WarContributorRow from "@/components/WarContributorRow";
import WarDebriefCard from "@/components/WarDebriefCard";

export default function WarsPage() {
  const { status } = useSession();
  const [data, setData] = useState<WarDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchWar = async () => {
      try {
        const res = await fetch("/api/wars/current");
        if (!res.ok) throw new Error("Erreur de chargement");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWar();
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <main className="flex min-h-screen flex-col items-center gap-6 px-4 pb-24 pt-12">
        <h1 className="text-xl font-bold text-white">⚔️ Guerre des Pelotons</h1>
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-white" />
          <p className="text-sm text-neutral-500">Chargement de la guerre...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center gap-6 px-4 pb-24 pt-12">
        <h1 className="text-xl font-bold text-white">⚔️ Guerre des Pelotons</h1>
        <p className="text-sm text-red-400">{error}</p>
      </main>
    );
  }

  if (!data) return null;

  // No club
  if (data.no_club) {
    return (
      <main className="flex min-h-screen flex-col items-center gap-6 px-4 pb-24 pt-12">
        <h1 className="text-xl font-bold text-white">⚔️ Guerre des Pelotons</h1>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 text-center">
          <span className="text-4xl">🛡️</span>
          <h2 className="mt-3 text-lg font-semibold text-white">
            Rejoins un club !
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            Tu dois faire partie d&apos;un club pour participer aux guerres.
          </p>
          <Link
            href="/clubs"
            className="mt-4 inline-block rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-neutral-200"
          >
            Voir les clubs
          </Link>
        </div>
      </main>
    );
  }

  // Club too small
  if (data.club_too_small) {
    return (
      <main className="flex min-h-screen flex-col items-center gap-6 px-4 pb-24 pt-12">
        <h1 className="text-xl font-bold text-white">⚔️ Guerre des Pelotons</h1>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 text-center">
          <span className="text-4xl">👥</span>
          <h2 className="mt-3 text-lg font-semibold text-white">
            Minimum 3 membres
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            Ton club a besoin d&apos;au moins 3 membres pour entrer en guerre.
            Invite tes potes !
          </p>
        </div>
      </main>
    );
  }

  // No match found
  if (data.no_match_found && !data.war) {
    return (
      <main className="flex min-h-screen flex-col items-center gap-6 px-4 pb-24 pt-12">
        <h1 className="text-xl font-bold text-white">⚔️ Guerre des Pelotons</h1>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 text-center">
          <span className="text-4xl">🔍</span>
          <h2 className="mt-3 text-lg font-semibold text-white">
            Aucun adversaire
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            Pas de club de niveau similaire disponible cette semaine.
            Reviens mardi !
          </p>
        </div>
      </main>
    );
  }

  // Debrief day (Monday) with no war data
  if (data.is_debrief_day && !data.war) {
    return (
      <main className="flex min-h-screen flex-col items-center gap-6 px-4 pb-24 pt-12">
        <h1 className="text-xl font-bold text-white">⚔️ Guerre des Pelotons</h1>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 text-center">
          <span className="text-4xl">📋</span>
          <h2 className="mt-3 text-lg font-semibold text-white">
            Jour de débrief
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            C&apos;est lundi ! Pas de guerre en cours. La prochaine commence mardi.
          </p>
        </div>
      </main>
    );
  }

  const war = data.war!;

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 px-4 pb-24 pt-12">
      <h1 className="text-xl font-bold text-white">⚔️ Guerre des Pelotons</h1>

      {/* Debrief card on Monday */}
      {data.is_debrief_day && (
        <WarDebriefCard
          myClubName={war.my_club.name}
          oppClubName={war.opponent_club.name}
          myScore={war.my_club_towers_won}
          oppScore={war.opp_club_towers_won}
          weekLabel={war.week_label}
        />
      )}

      {/* Matchup header */}
      <WarMatchupHeader
        myClubName={war.my_club.name}
        myClubLogo={war.my_club.logo_url}
        oppClubName={war.opponent_club.name}
        oppClubLogo={war.opponent_club.logo_url}
        myScore={war.my_club_towers_won}
        oppScore={war.opp_club_towers_won}
        weekLabel={war.week_label}
        status={war.status}
        endsAt={war.ends_at}
      />

      {/* 3 Towers */}
      <div className="flex w-full max-w-lg flex-col gap-3">
        <WarTowerBar
          icon="👑"
          label="Tour Roi"
          unit="km"
          myProgress={war.towers.roi.my_progress}
          oppProgress={war.towers.roi.opp_progress}
          target={war.towers.roi.my_target}
          myWinner={war.towers.roi.my_winner}
          oppWinner={war.towers.roi.opp_winner}
          myClubName={war.my_club.name}
          oppClubName={war.opponent_club.name}
        />

        <WarTowerBar
          icon="⛰️"
          label="Tour Montagne"
          unit="m D+"
          myProgress={war.towers.montagne.my_progress}
          oppProgress={war.towers.montagne.opp_progress}
          target={war.towers.montagne.my_target}
          myWinner={war.towers.montagne.my_winner}
          oppWinner={war.towers.montagne.opp_winner}
          myClubName={war.my_club.name}
          oppClubName={war.opponent_club.name}
        />

        <WarTowerBar
          icon="⚡"
          label="Tour Sprint"
          unit="sprints"
          myProgress={war.towers.sprint.my_progress}
          oppProgress={war.towers.sprint.opp_progress}
          target={war.towers.sprint.my_target}
          myWinner={war.towers.sprint.my_winner}
          oppWinner={war.towers.sprint.opp_winner}
          myClubName={war.my_club.name}
          oppClubName={war.opponent_club.name}
        />
      </div>

      {/* Contributors */}
      {war.contributions.length > 0 && (
        <div className="w-full max-w-lg">
          <h2 className="mb-2 text-sm font-semibold text-neutral-400">
            Top contributeurs
          </h2>
          <div className="flex flex-col gap-1.5">
            {war.contributions.map((c, i) => (
              <WarContributorRow
                key={c.user_id}
                rank={i + 1}
                username={c.username}
                avatarUrl={c.avatar_url}
                km={c.km_contributed}
                dplus={c.dplus_contributed}
                sprints={c.sprints_contributed}
              />
            ))}
          </div>
        </div>
      )}

      {/* History link */}
      <Link
        href="/wars/history"
        className="mt-2 text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-300"
      >
        Voir l&apos;historique des guerres
      </Link>
    </main>
  );
}
