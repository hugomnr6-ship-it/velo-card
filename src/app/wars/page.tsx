"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import type { WarDashboard } from "@/types";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { AnimatedList, AnimatedListItem } from "@/components/AnimatedList";
import { WarsSkeleton } from "@/components/Skeleton";
import { SwordsIcon, ShieldIcon } from "@/components/icons/TabIcons";
import { IconCrown, IconMountain, IconLightning, IconShield } from "@/components/icons/VeloIcons";
import WarMatchupHeader from "@/components/WarMatchupHeader";
import WarTowerBar from "@/components/WarTowerBar";
import WarContributorRow from "@/components/WarContributorRow";
import WarDebriefCard from "@/components/WarDebriefCard";
import { useWarDashboard } from "@/hooks/useWars";

export default function WarsPage() {
  const { status } = useSession();

  // Fetch war dashboard via React Query hook
  const { data, isLoading: loading, error: warError } = useWarDashboard();
  const error = warError ? "Erreur de chargement" : null;

  if (status === "loading" || loading) {
    return (
      <main className="flex min-h-screen flex-col items-center gap-6 px-4 pb-24 pt-12">
        <WarsSkeleton />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center gap-6 px-4 pb-24 pt-12">
        <PageHeader icon={<SwordsIcon size={28} />} title="Guerre des Pelotons" />
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </main>
    );
  }

  if (!data) return null;

  if (data.no_club) {
    return (
      <AnimatedPage className="flex min-h-screen flex-col items-center gap-6 px-4 pb-24 pt-12">
        <PageHeader icon={<SwordsIcon size={28} />} title="Guerre des Pelotons" />
        <EmptyState
          icon={<ShieldIcon size={48} />}
          title="Rejoins un club !"
          description="Tu dois faire partie d'un club pour participer aux guerres."
          action={{ label: "Voir les clubs", href: "/clubs" }}
        />
      </AnimatedPage>
    );
  }

  if (data.club_too_small) {
    return (
      <AnimatedPage className="flex min-h-screen flex-col items-center gap-6 px-4 pb-24 pt-12">
        <PageHeader icon={<SwordsIcon size={28} />} title="Guerre des Pelotons" />
        <EmptyState
          icon={<IconShield size={36} className="text-white/30" />}
          title="Minimum 3 membres"
          description="Ton club a besoin d'au moins 3 membres pour entrer en guerre. Invite tes potes !"
        />
      </AnimatedPage>
    );
  }

  if (data.no_match_found && !data.war) {
    return (
      <AnimatedPage className="flex min-h-screen flex-col items-center gap-6 px-4 pb-24 pt-12">
        <PageHeader icon={<SwordsIcon size={28} />} title="Guerre des Pelotons" />
        <EmptyState
          icon={<IconShield size={36} className="text-white/30" />}
          title="Aucun adversaire"
          description="Pas de club de niveau similaire disponible cette semaine. Reviens mardi !"
        />
      </AnimatedPage>
    );
  }

  if (data.is_debrief_day && !data.war) {
    return (
      <AnimatedPage className="flex min-h-screen flex-col items-center gap-6 px-4 pb-24 pt-12">
        <PageHeader icon={<SwordsIcon size={28} />} title="Guerre des Pelotons" />
        <EmptyState
          icon={<IconShield size={36} className="text-white/30" />}
          title="Jour de debrief"
          description="C'est lundi ! Pas de guerre en cours. La prochaine commence mardi."
        />
      </AnimatedPage>
    );
  }

  const war = data.war!;

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center gap-4 px-4 pb-24 pt-12">
      <PageHeader icon={<SwordsIcon size={28} />} title="Guerre des Pelotons" />

      {data.is_debrief_day && (
        <WarDebriefCard
          myClubName={war.my_club.name}
          oppClubName={war.opponent_club.name}
          myScore={war.my_club_towers_won}
          oppScore={war.opp_club_towers_won}
          weekLabel={war.week_label}
        />
      )}

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

      <AnimatedList className="flex w-full max-w-lg flex-col gap-3">
        <AnimatedListItem>
          <WarTowerBar
            icon={<IconCrown size={20} className="text-[#FFD700]" />}
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
        </AnimatedListItem>
        <AnimatedListItem>
          <WarTowerBar
            icon={<IconMountain size={20} className="text-white/60" />}
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
        </AnimatedListItem>
        <AnimatedListItem>
          <WarTowerBar
            icon={<IconLightning size={20} className="text-[#FFD700]" />}
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
        </AnimatedListItem>
      </AnimatedList>

      {war.contributions.length > 0 && (
        <div className="w-full max-w-lg">
          <h2 className="mb-2 text-sm font-semibold text-[#94A3B8]">
            Top contributeurs
          </h2>
          <AnimatedList className="flex flex-col gap-1.5" delay={0.06}>
            {war.contributions.map((c, i) => (
              <AnimatedListItem key={c.user_id}>
                <WarContributorRow
                  rank={i + 1}
                  username={c.username}
                  avatarUrl={c.avatar_url}
                  km={c.km_contributed}
                  dplus={c.dplus_contributed}
                  sprints={c.sprints_contributed}
                />
              </AnimatedListItem>
            ))}
          </AnimatedList>
        </div>
      )}

      <Link
        href="/wars/history"
        className="mt-2 text-xs text-[#94A3B8] underline underline-offset-2 hover:text-white/80"
      >
        Voir l&apos;historique des guerres
      </Link>
    </AnimatedPage>
  );
}
