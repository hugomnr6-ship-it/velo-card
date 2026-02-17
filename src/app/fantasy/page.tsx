"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { m } from "framer-motion";
import Link from "next/link";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { AnimatedList, AnimatedListItem } from "@/components/AnimatedList";
import Skeleton from "@/components/Skeleton";
import { useMyLeagues, useJoinLeague } from "@/hooks/useFantasy";
import { useCoins } from "@/hooks/useCoins";
import { useToast } from "@/contexts/ToastContext";

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "#A78BFA" },
  active: { label: "En cours", color: "#00F5D4" },
  completed: { label: "Terminée", color: "#64748B" },
};

export default function FantasyHubPage() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { data, isLoading } = useMyLeagues();
  const { data: coins } = useCoins();
  const joinLeague = useJoinLeague();
  const [inviteCode, setInviteCode] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  async function handleJoinByCode() {
    if (!inviteCode.trim()) return;
    try {
      await joinLeague.mutateAsync({ leagueId: inviteCode.trim(), inviteCode: inviteCode.trim() });
      toast("Vous avez rejoint la ligue !", "success");
      setShowJoinModal(false);
      setInviteCode("");
    } catch (err: any) {
      toast(err.message || "Erreur", "error");
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <div className="w-full max-w-md">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="mb-4 h-32 w-full rounded-xl" />
          ))}
        </div>
      </main>
    );
  }

  const myLeagues = data?.myLeagues || [];
  const publicLeagues = data?.publicLeagues || [];

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-md">
        <PageHeader
          icon={<span className="text-2xl">&#9917;</span>}
          title="Fantasy Cycling"
          subtitle={coins ? `${coins.balance} VeloCoins` : undefined}
        />

        {/* Actions */}
        <div className="mb-6 flex gap-2">
          <Link
            href="/fantasy/create"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#6366F1]/30 bg-[#6366F1]/10 py-3 text-xs font-bold text-[#6366F1] transition hover:bg-[#6366F1]/20"
          >
            + Créer une ligue
          </Link>
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 py-3 text-xs font-bold text-[#94A3B8] transition hover:text-white"
          >
            Code invitation
          </button>
        </div>

        {/* Join Modal */}
        {showJoinModal && (
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-white/[0.06] bg-[#1A1A2E]/80 p-4"
          >
            <p className="mb-2 text-xs font-bold text-white">Rejoindre par code</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="EX: ABC123"
                maxLength={6}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold uppercase tracking-widest text-white placeholder:text-white/20 focus:border-[#6366F1]/50 focus:outline-none"
              />
              <button
                onClick={handleJoinByCode}
                disabled={joinLeague.isPending || !inviteCode.trim()}
                className="rounded-lg bg-[#6366F1] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#6366F1]/80 disabled:opacity-40"
              >
                {joinLeague.isPending ? "..." : "Rejoindre"}
              </button>
            </div>
            <button
              onClick={() => setShowJoinModal(false)}
              className="mt-2 text-[10px] text-[#64748B] hover:text-white"
            >
              Annuler
            </button>
          </m.div>
        )}

        {/* My leagues */}
        {myLeagues.length > 0 && (
          <div className="mb-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#A78BFA]">
              Mes ligues
            </p>
            <AnimatedList className="flex flex-col gap-3">
              {myLeagues.map((league) => (
                <AnimatedListItem key={league.id}>
                  <LeagueCard league={league} />
                </AnimatedListItem>
              ))}
            </AnimatedList>
          </div>
        )}

        {/* Public leagues */}
        {publicLeagues.length > 0 && (
          <div className="mb-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#00F5D4]">
              Ligues publiques
            </p>
            <AnimatedList className="flex flex-col gap-3">
              {publicLeagues.map((league) => (
                <AnimatedListItem key={league.id}>
                  <LeagueCard league={league} showJoin onJoin={async () => {
                    try {
                      await joinLeague.mutateAsync({ leagueId: league.id });
                      toast("Inscrit !", "success");
                    } catch (err: any) {
                      toast(err.message || "Erreur", "error");
                    }
                  }} joining={joinLeague.isPending} />
                </AnimatedListItem>
              ))}
            </AnimatedList>
          </div>
        )}

        {myLeagues.length === 0 && publicLeagues.length === 0 && (
          <EmptyState
            icon={<span className="text-4xl">&#9917;</span>}
            title="Aucune ligue"
            description="Créez votre première ligue Fantasy Cycling ou rejoignez-en une !"
          />
        )}
      </div>
    </AnimatedPage>
  );
}

function LeagueCard({
  league,
  showJoin,
  onJoin,
  joining,
}: {
  league: any;
  showJoin?: boolean;
  onJoin?: () => void;
  joining?: boolean;
}) {
  const st = statusLabels[league.status] || statusLabels.completed;

  return (
    <m.div
      className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60"
      whileTap={{ scale: 0.98 }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-white">{league.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ color: st.color, background: `${st.color}15`, border: `1px solid ${st.color}30` }}
              >
                {st.label}
              </span>
              <span className="text-[10px] text-[#64748B]">
                par {league.creator?.username || "?"}
              </span>
            </div>
          </div>
          {league.prize_pool > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-lg font-black text-[#FFD700]">{league.prize_pool}</span>
              <span className="text-[9px] font-bold text-[#475569]">PRIZE POOL</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-[10px] text-[#64748B]">
          <span>{league.participant_count}/{league.max_participants} joueurs</span>
          <span>{league.duration_weeks} semaines</span>
          {league.entry_fee > 0 && (
            <span>{league.entry_fee} coins d&apos;entrée</span>
          )}
        </div>
      </div>

      <div className="flex">
        <Link
          href={`/fantasy/${league.id}`}
          className="flex flex-1 items-center justify-center border-t border-white/[0.06] py-2.5 text-xs font-bold text-[#94A3B8] transition hover:text-white"
        >
          Voir détails
        </Link>
        {showJoin && league.status === "draft" && (
          <button
            onClick={onJoin}
            disabled={joining}
            className="flex flex-1 items-center justify-center border-l border-t border-[#6366F1]/20 bg-[#6366F1]/10 py-2.5 text-xs font-bold text-[#6366F1] transition hover:bg-[#6366F1]/20 disabled:opacity-40"
          >
            Rejoindre
          </button>
        )}
      </div>
    </m.div>
  );
}
