"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { m } from "framer-motion";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import Skeleton from "@/components/Skeleton";
import { useTournamentDetail } from "@/hooks/useTournaments";

export default function TournamentDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading } = useTournamentDetail(id);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <div className="w-full max-w-lg">
          <Skeleton className="mb-4 h-20 w-full rounded-xl" />
          <Skeleton className="mb-2 h-60 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  if (!data) return null;

  const { tournament, matches } = data;
  const maxRound = matches.reduce((m, match) => Math.max(m, match.round), 0);

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-lg">
        {/* Back button */}
        <button
          onClick={() => router.push("/tournaments")}
          className="mb-3 text-xs font-bold text-[#94A3B8] hover:text-white"
        >
          &larr; Retour aux tournois
        </button>

        <PageHeader
          icon={<span className="text-2xl">&#127942;</span>}
          title={tournament.name}
          subtitle={`${tournament.category.toUpperCase()} — Prize pool: ${tournament.prize_pool_coins} coins`}
        />

        {/* Bracket */}
        <div className="overflow-x-auto">
          <div className="flex gap-6" style={{ minWidth: maxRound * 200 }}>
            {Array.from({ length: maxRound }, (_, r) => r + 1).map((round) => {
              const roundMatches = matches
                .filter((m) => m.round === round)
                .sort((a, b) => a.match_number - b.match_number);

              return (
                <div key={round} className="flex min-w-[180px] flex-col gap-3">
                  <p className="text-center text-xs font-bold uppercase tracking-widest text-[#64748B]">
                    {round === maxRound ? "Finale" : round === maxRound - 1 ? "Demi-finales" : `Tour ${round}`}
                  </p>
                  <div className="flex flex-1 flex-col justify-around gap-3">
                    {roundMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Participants */}
        <div className="mt-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#94A3B8]">
            Participants ({data.participants.length})
          </p>
          <div className="grid grid-cols-2 gap-2">
            {data.participants
              .sort((a, b) => a.seed - b.seed)
              .map((p) => (
                <div
                  key={p.user_id}
                  className={`flex items-center gap-2 rounded-lg border p-2 ${
                    p.is_eliminated
                      ? "border-white/[0.04] bg-[#1A1A2E]/30 opacity-40"
                      : "border-white/[0.06] bg-[#1A1A2E]/60"
                  }`}
                >
                  {p.profiles?.avatar_url ? (
                    <img
                      src={`/api/img?url=${encodeURIComponent(p.profiles.avatar_url)}`}
                      alt=""
                      className="h-7 w-7 rounded-full border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#22223A] text-[10px] font-bold text-white/50">
                      {(p.profiles?.username || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">
                      {p.profiles?.username || "Cycliste"}
                    </p>
                    <p className="text-[9px] text-[#64748B]">
                      Seed #{p.seed} — OVR {p.user_stats?.ovr || "?"}
                    </p>
                  </div>
                  {p.final_rank === 1 && (
                    <span className="text-sm">&#127942;</span>
                  )}
                  {p.is_eliminated && (
                    <span className="text-[10px] text-red-400">Elimine</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}

function MatchCard({ match }: { match: any }) {
  const isResolved = match.status === "resolved";
  const isBye = !match.player_a_id || !match.player_b_id;

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-lg border border-white/[0.06] bg-[#1A1A2E]/60 overflow-hidden"
    >
      {/* Player A */}
      <div
        className={`flex items-center justify-between px-3 py-2 ${
          isResolved && match.winner_id === match.player_a_id
            ? "bg-[#00F5D4]/5"
            : ""
        }`}
      >
        <span className="truncate text-xs font-bold text-white">
          {match.player_a?.username || (match.player_a_id ? "..." : "BYE")}
        </span>
        {match.player_a_value != null && (
          <span
            className={`text-xs font-black ${
              isResolved && match.winner_id === match.player_a_id
                ? "text-[#00F5D4]"
                : "text-[#64748B]"
            }`}
          >
            {match.player_a_value}
          </span>
        )}
      </div>
      <div className="h-px bg-white/[0.06]" />
      {/* Player B */}
      <div
        className={`flex items-center justify-between px-3 py-2 ${
          isResolved && match.winner_id === match.player_b_id
            ? "bg-[#00F5D4]/5"
            : ""
        }`}
      >
        <span className="truncate text-xs font-bold text-white">
          {match.player_b?.username || (match.player_b_id ? "..." : "BYE")}
        </span>
        {match.player_b_value != null && (
          <span
            className={`text-xs font-black ${
              isResolved && match.winner_id === match.player_b_id
                ? "text-[#00F5D4]"
                : "text-[#64748B]"
            }`}
          >
            {match.player_b_value}
          </span>
        )}
      </div>
    </m.div>
  );
}
