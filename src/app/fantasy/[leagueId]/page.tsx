"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { m } from "framer-motion";
import Link from "next/link";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import Skeleton from "@/components/Skeleton";
import { useFantasyLeague, useJoinLeague, useStartLeague } from "@/hooks/useFantasy";
import { useToast } from "@/contexts/ToastContext";

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "#A78BFA" },
  active: { label: "En cours", color: "#00F5D4" },
  completed: { label: "Terminée", color: "#64748B" },
};

export default function FantasyLeaguePage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const leagueId = params.leagueId as string;
  const { data, isLoading, refetch } = useFantasyLeague(leagueId);
  const joinLeague = useJoinLeague();
  const startLeague = useStartLeague();
  const { toast } = useToast();
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <div className="w-full max-w-md">
          <Skeleton className="mb-4 h-24 w-full rounded-xl" />
          <Skeleton className="mb-2 h-40 w-full rounded-xl" />
          <Skeleton className="h-60 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  if (!data) return null;

  const { league, participants, isParticipant } = data;
  const st = statusLabels[league.status] || statusLabels.completed;
  const isCreator = session?.user?.profileId === league.creator_id;

  async function handleJoin() {
    try {
      await joinLeague.mutateAsync({ leagueId: league.id });
      toast("Inscrit !", "success");
      refetch();
    } catch (err: any) {
      toast(err.message || "Erreur", "error");
    }
  }

  async function handleStart() {
    try {
      await startLeague.mutateAsync(league.id);
      toast("Ligue lancée !", "success");
      refetch();
    } catch (err: any) {
      toast(err.message || "Erreur", "error");
    }
  }

  function copyInviteCode() {
    navigator.clipboard.writeText(league.invite_code || "");
    toast("Code copié !", "success");
  }

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push("/fantasy")}
          className="mb-3 text-xs font-bold text-[#94A3B8] hover:text-white"
        >
          &larr; Retour
        </button>

        <PageHeader
          icon={<span className="text-2xl">&#9917;</span>}
          title={league.name}
          subtitle={`par ${league.creator?.username || "?"}`}
        />

        {/* Status + Info bar */}
        <div className="mb-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-4">
          <div className="flex items-center gap-3">
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{ color: st.color, background: `${st.color}15`, border: `1px solid ${st.color}30` }}
            >
              {st.label}
            </span>
            <span className="text-xs text-[#64748B]">
              {league.participant_count}/{league.max_participants} joueurs
            </span>
          </div>
          {league.prize_pool > 0 && (
            <div className="text-right">
              <span className="text-lg font-black text-[#FFD700]">{league.prize_pool}</span>
              <span className="ml-1 text-[9px] text-[#475569]">coins</span>
            </div>
          )}
        </div>

        {/* Invite code */}
        {league.status === "draft" && league.invite_code && (
          <m.div
            className="mb-4 flex items-center justify-between rounded-xl border border-[#A78BFA]/20 bg-[#A78BFA]/5 px-4 py-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div>
              <p className="text-[10px] font-bold text-[#A78BFA]">CODE INVITATION</p>
              <p className="text-lg font-black tracking-[0.3em] text-white">{league.invite_code}</p>
            </div>
            <button
              onClick={copyInviteCode}
              className="rounded-lg bg-[#A78BFA]/20 px-3 py-1.5 text-xs font-bold text-[#A78BFA] transition hover:bg-[#A78BFA]/30"
            >
              Copier
            </button>
          </m.div>
        )}

        {/* Actions */}
        <div className="mb-6 flex gap-2">
          {league.status === "draft" && !isParticipant && (
            <button
              onClick={handleJoin}
              disabled={joinLeague.isPending}
              className="flex-1 rounded-xl bg-[#6366F1] py-3 text-xs font-bold text-white transition hover:bg-[#6366F1]/80 disabled:opacity-40"
            >
              {joinLeague.isPending ? "..." : `Rejoindre${league.entry_fee > 0 ? ` (${league.entry_fee} coins)` : ""}`}
            </button>
          )}
          {league.status === "draft" && isParticipant && (
            <Link
              href={`/fantasy/${league.id}/draft`}
              className="flex flex-1 items-center justify-center rounded-xl border border-[#00F5D4]/30 bg-[#00F5D4]/10 py-3 text-xs font-bold text-[#00F5D4] transition hover:bg-[#00F5D4]/20"
            >
              &#128100; Mon draft
            </Link>
          )}
          {league.status === "draft" && isCreator && league.participant_count >= 4 && (
            <button
              onClick={handleStart}
              disabled={startLeague.isPending}
              className="flex-1 rounded-xl bg-[#FF6B35] py-3 text-xs font-bold text-white transition hover:bg-[#FF6B35]/80 disabled:opacity-40"
            >
              {startLeague.isPending ? "..." : "&#9654; Lancer la ligue"}
            </button>
          )}
          {league.status === "active" && (
            <Link
              href={`/fantasy/${league.id}/scores`}
              className="flex flex-1 items-center justify-center rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/10 py-3 text-xs font-bold text-[#FFD700] transition hover:bg-[#FFD700]/20"
            >
              &#128200; Scores
            </Link>
          )}
        </div>

        {/* League info */}
        <div className="mb-6 grid grid-cols-3 gap-2">
          <InfoBox label="Durée" value={`${league.duration_weeks}sem`} />
          <InfoBox label="Budget draft" value={`${league.draft_budget}`} />
          <InfoBox label="Semaine" value={league.status === "active" ? `${league.current_week}/${league.duration_weeks}` : "-"} />
        </div>

        {/* Ranking / Participants */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#94A3B8]">
            {league.status === "draft" ? "Participants" : "Classement"}
          </p>
          <div className="flex flex-col gap-2">
            {participants
              .sort((a, b) => {
                if (league.status !== "draft" && a.rank && b.rank) return a.rank - b.rank;
                return 0;
              })
              .map((p, idx) => (
                <m.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-3"
                >
                  {league.status !== "draft" && (
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                      idx === 0 ? "bg-[#FFD700]/20 text-[#FFD700]" :
                      idx === 1 ? "bg-[#C0C0C0]/20 text-[#C0C0C0]" :
                      idx === 2 ? "bg-[#CD7F32]/20 text-[#CD7F32]" :
                      "bg-white/5 text-[#64748B]"
                    }`}>
                      {idx + 1}
                    </span>
                  )}
                  {p.user?.avatar_url ? (
                    <img
                      src={`/api/img?url=${encodeURIComponent(p.user.avatar_url)}`}
                      alt=""
                      className="h-8 w-8 rounded-full border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22223A] text-xs font-bold text-white/50">
                      {(p.user?.username || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">
                      {p.user?.username || "Cycliste"}
                    </p>
                    <p className="text-[10px] text-[#64748B]">
                      {p.team?.length || 0}/5 cyclistes
                      {league.status !== "draft" && ` — ${p.total_points} pts`}
                    </p>
                  </div>
                  {league.status !== "draft" && (
                    <span className="text-sm font-black text-[#00F5D4]">
                      {p.total_points}
                    </span>
                  )}
                </m.div>
              ))}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#1A1A2E]/40 p-3 text-center">
      <p className="text-[10px] font-bold text-[#64748B]">{label}</p>
      <p className="text-sm font-black text-white">{value}</p>
    </div>
  );
}
