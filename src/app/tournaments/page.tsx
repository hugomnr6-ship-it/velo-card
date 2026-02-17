"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { m } from "framer-motion";
import Link from "next/link";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { AnimatedList, AnimatedListItem } from "@/components/AnimatedList";
import Skeleton from "@/components/Skeleton";
import { useTournaments, useJoinTournament } from "@/hooks/useTournaments";
import { useCoins } from "@/hooks/useCoins";
import { useToast } from "@/contexts/ToastContext";

const statusLabels: Record<string, { label: string; color: string }> = {
  registration: { label: "Inscriptions", color: "#00F5D4" },
  active: { label: "En cours", color: "#FF6B35" },
  finished: { label: "Termine", color: "#64748B" },
};

const categoryLabels: Record<string, string> = {
  ovr: "OVR",
  pac: "VIT",
  mon: "MON",
  val: "TEC",
  spr: "SPR",
  end: "END",
  res: "PUI",
};

export default function TournamentsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { data: tournaments, isLoading } = useTournaments();
  const { data: coins } = useCoins();
  const joinTournament = useJoinTournament();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  async function handleJoin(tournamentId: string, cost: number) {
    if ((coins?.balance || 0) < cost) {
      toast("VeloCoins insuffisants", "error");
      return;
    }
    try {
      await joinTournament.mutateAsync(tournamentId);
      toast("Inscrit au tournoi !", "success");
    } catch (err: any) {
      toast(err.message || "Erreur inscription", "error");
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <div className="w-full max-w-md">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="mb-4 h-36 w-full rounded-xl" />
          ))}
        </div>
      </main>
    );
  }

  const registration = (tournaments || []).filter((t) => t.status === "registration");
  const active = (tournaments || []).filter((t) => t.status === "active");

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-md">
        <PageHeader
          icon={<span className="text-2xl">&#127942;</span>}
          title="Tournois"
          subtitle={coins ? `${coins.balance} VeloCoins` : undefined}
        />

        {registration.length === 0 && active.length === 0 ? (
          <EmptyState
            icon={<span className="text-4xl">&#127942;</span>}
            title="Aucun tournoi"
            description="Les prochains tournois arrivent bientot !"
          />
        ) : (
          <>
            {/* Registration open */}
            {registration.length > 0 && (
              <div className="mb-6">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#00F5D4]">
                  Inscriptions ouvertes
                </p>
                <AnimatedList className="flex flex-col gap-3">
                  {registration.map((t) => (
                    <AnimatedListItem key={t.id}>
                      <TournamentCard
                        tournament={t}
                        canJoin
                        canAfford={(coins?.balance || 0) >= t.entry_cost_coins}
                        joining={joinTournament.isPending}
                        onJoin={() => handleJoin(t.id, t.entry_cost_coins)}
                      />
                    </AnimatedListItem>
                  ))}
                </AnimatedList>
              </div>
            )}

            {/* Active */}
            {active.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#FF6B35]">
                  En cours
                </p>
                <AnimatedList className="flex flex-col gap-3">
                  {active.map((t) => (
                    <AnimatedListItem key={t.id}>
                      <TournamentCard tournament={t} />
                    </AnimatedListItem>
                  ))}
                </AnimatedList>
              </div>
            )}
          </>
        )}
      </div>
    </AnimatedPage>
  );
}

function TournamentCard({
  tournament,
  canJoin,
  canAfford,
  joining,
  onJoin,
}: {
  tournament: any;
  canJoin?: boolean;
  canAfford?: boolean;
  joining?: boolean;
  onJoin?: () => void;
}) {
  const st = statusLabels[tournament.status] || statusLabels.finished;

  return (
    <m.div
      className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60"
      whileTap={{ scale: 0.98 }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-base font-bold text-white">{tournament.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ color: st.color, background: `${st.color}15`, border: `1px solid ${st.color}30` }}
              >
                {st.label}
              </span>
              <span className="text-[10px] font-bold text-[#64748B]">
                {categoryLabels[tournament.category] || tournament.category}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-lg font-black text-[#FFD700]">{tournament.prize_pool_coins}</span>
            <span className="text-[9px] font-bold text-[#475569]">PRIZE POOL</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[10px] text-[#64748B]">
          <span>
            {tournament.current_participants || "?"}/{tournament.max_participants} joueurs
          </span>
          <span>{tournament.entry_cost_coins} coins d&apos;entree</span>
        </div>
      </div>

      <div className="flex">
        <Link
          href={`/tournaments/${tournament.id}`}
          className="flex flex-1 items-center justify-center border-t border-white/[0.06] py-2.5 text-xs font-bold text-[#94A3B8] transition hover:text-white"
        >
          Voir bracket
        </Link>
        {canJoin && (
          <button
            onClick={onJoin}
            disabled={!canAfford || joining}
            className={`flex flex-1 items-center justify-center border-l border-t py-2.5 text-xs font-bold transition ${
              canAfford && !joining
                ? "border-[#6366F1]/20 bg-[#6366F1]/10 text-[#6366F1] hover:bg-[#6366F1]/20"
                : "border-white/[0.06] text-[#475569] cursor-not-allowed"
            }`}
          >
            S&apos;inscrire
          </button>
        )}
      </div>
    </m.div>
  );
}
