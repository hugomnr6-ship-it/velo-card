"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import Skeleton from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import {
  useFantasyLeague,
  useAvailableCyclists,
  useDraftCyclist,
  useRemoveCyclist,
} from "@/hooks/useFantasy";
import { useToast } from "@/contexts/ToastContext";
import { ECONOMY } from "@/lib/economy";

const tierColors: Record<string, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platine: "#00F5D4",
  diamant: "#A78BFA",
};

export default function FantasyDraftPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const leagueId = params.leagueId as string;
  const { data: leagueData, isLoading: leagueLoading } = useFantasyLeague(leagueId);
  const { data: available, isLoading: availableLoading } = useAvailableCyclists(leagueId);
  const draftCyclist = useDraftCyclist();
  const removeCyclist = useRemoveCyclist();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"ovr" | "cost" | "pac" | "mon">("ovr");
  const [selectedCyclist, setSelectedCyclist] = useState<string | null>(null);
  const [isCaptain, setIsCaptain] = useState(false);
  const [isSuperSub, setIsSuperSub] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  if (status === "loading" || leagueLoading || availableLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <div className="w-full max-w-md">
          <Skeleton className="mb-4 h-24 w-full rounded-xl" />
          <Skeleton className="mb-2 h-60 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  if (!leagueData) return null;

  const { league, myParticipantId } = leagueData;
  const myParticipant = leagueData.participants.find((p) => p.id === myParticipantId);
  const myTeam = myParticipant?.team || [];
  const usedBudget = myTeam.reduce((s, t) => s + (t.draft_cost || 0), 0);
  const remainingBudget = league.draft_budget - usedBudget;
  const hasCaptain = myTeam.some((t) => t.is_captain);
  const hasSuperSub = myTeam.some((t) => t.is_super_sub);

  // Filter & sort available cyclists
  const filtered = (available || [])
    .filter((c) => c.username.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "cost") return b.cost - a.cost;
      if (sortBy === "pac") return b.pac - a.pac;
      if (sortBy === "mon") return b.mon - a.mon;
      return b.ovr - a.ovr;
    });

  async function handleDraft(cyclistId: string) {
    try {
      await draftCyclist.mutateAsync({ leagueId, cyclistId, isCaptain, isSuperSub });
      toast("Cycliste drafté !", "success");
      setSelectedCyclist(null);
      setIsCaptain(false);
      setIsSuperSub(false);
    } catch (err: any) {
      toast(err.message || "Erreur draft", "error");
    }
  }

  async function handleRemove(cyclistId: string) {
    try {
      await removeCyclist.mutateAsync({ leagueId, cyclistId });
      toast("Cycliste retiré", "success");
    } catch (err: any) {
      toast(err.message || "Erreur", "error");
    }
  }

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push(`/fantasy/${leagueId}`)}
          className="mb-3 text-xs font-bold text-[#94A3B8] hover:text-white"
        >
          &larr; Retour à la ligue
        </button>

        <PageHeader
          icon={<span className="text-2xl">&#128100;</span>}
          title="Draft"
          subtitle={`${myTeam.length}/${ECONOMY.FANTASY_TEAM_SIZE} cyclistes`}
        />

        {/* Budget bar */}
        <div className="mb-4 rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#94A3B8]">Budget restant</span>
            <span className="text-lg font-black text-[#00F5D4]">{remainingBudget}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
            <m.div
              className="h-full rounded-full bg-[#00F5D4]"
              initial={{ width: 0 }}
              animate={{ width: `${(remainingBudget / league.draft_budget) * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-[#64748B]">
            <span>{usedBudget} utilisé</span>
            <span>{league.draft_budget} total</span>
          </div>
        </div>

        {/* My Team */}
        {myTeam.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#A78BFA]">
              Mon équipe
            </p>
            <div className="flex flex-col gap-2">
              {myTeam.map((member) => (
                <m.div
                  key={member.cyclist_id}
                  layout
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-3"
                >
                  {member.cyclist?.avatar_url ? (
                    <img
                      src={`/api/img?url=${encodeURIComponent(member.cyclist.avatar_url)}`}
                      alt=""
                      className="h-8 w-8 rounded-full border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22223A] text-xs font-bold text-white/50">
                      {(member.cyclist?.username || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-bold text-white">
                        {member.cyclist?.username || "Cycliste"}
                      </p>
                      {member.is_captain && (
                        <span className="rounded bg-[#FFD700]/20 px-1.5 py-0.5 text-[9px] font-black text-[#FFD700]">
                          CAP
                        </span>
                      )}
                      {member.is_super_sub && (
                        <span className="rounded bg-[#FF6B35]/20 px-1.5 py-0.5 text-[9px] font-black text-[#FF6B35]">
                          SUB
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#64748B]">
                      OVR {member.cyclist?.ovr || "?"} — Coût {member.draft_cost}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(member.cyclist_id)}
                    disabled={removeCyclist.isPending}
                    className="text-xs text-red-400/60 transition hover:text-red-400"
                  >
                    ✕
                  </button>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Sort */}
        {myTeam.length < ECONOMY.FANTASY_TEAM_SIZE && (
          <>
            <div className="mb-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un cycliste..."
                className="w-full rounded-xl border border-white/10 bg-[#1A1A2E]/60 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-[#6366F1]/50 focus:outline-none"
              />
            </div>
            <div className="mb-4 flex gap-1.5">
              {(["ovr", "cost", "pac", "mon"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase transition ${
                    sortBy === s
                      ? "border-[#6366F1]/50 bg-[#6366F1]/10 text-[#6366F1]"
                      : "border-white/[0.06] text-[#64748B] hover:text-white"
                  }`}
                >
                  {s === "cost" ? "Coût" : s.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Available cyclists */}
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#00F5D4]">
              Disponibles ({filtered.length})
            </p>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<span className="text-3xl">&#128566;</span>}
                title="Aucun cycliste"
                description="Aucun cycliste disponible"
              />
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((c) => {
                  const canAfford = c.cost <= remainingBudget;
                  const isSelected = selectedCyclist === c.id;

                  return (
                    <div key={c.id}>
                      <m.button
                        onClick={() => setSelectedCyclist(isSelected ? null : c.id)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? "border-[#6366F1]/50 bg-[#6366F1]/10"
                            : canAfford
                              ? "border-white/[0.06] bg-[#1A1A2E]/60 hover:border-white/10"
                              : "border-white/[0.04] bg-[#1A1A2E]/30 opacity-50"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          {c.avatar_url ? (
                            <img
                              src={`/api/img?url=${encodeURIComponent(c.avatar_url)}`}
                              alt=""
                              className="h-9 w-9 rounded-full border border-white/10 object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22223A] text-xs font-bold text-white/50">
                              {c.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-xs font-bold text-white">{c.username}</p>
                              <span
                                className="rounded px-1 py-0.5 text-[9px] font-black"
                                style={{ color: tierColors[c.tier] || "#94A3B8", background: `${tierColors[c.tier] || "#94A3B8"}15` }}
                              >
                                {c.tier?.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#64748B]">
                              OVR {c.ovr} — VIT {c.pac} — MON {c.mon}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-black ${canAfford ? "text-[#FFD700]" : "text-red-400"}`}>
                              {c.cost}
                            </p>
                            <p className="text-[9px] text-[#475569]">coins</p>
                          </div>
                        </div>
                      </m.button>

                      {/* Draft options panel */}
                      <AnimatePresence>
                        {isSelected && canAfford && (
                          <m.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="flex items-center gap-2 px-3 py-2">
                              {!hasCaptain && (
                                <button
                                  onClick={() => { setIsCaptain(!isCaptain); setIsSuperSub(false); }}
                                  className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold transition ${
                                    isCaptain
                                      ? "border-[#FFD700]/50 bg-[#FFD700]/10 text-[#FFD700]"
                                      : "border-white/[0.06] text-[#64748B] hover:text-white"
                                  }`}
                                >
                                  &#9733; Capitaine (×2)
                                </button>
                              )}
                              {!hasSuperSub && (
                                <button
                                  onClick={() => { setIsSuperSub(!isSuperSub); setIsCaptain(false); }}
                                  className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold transition ${
                                    isSuperSub
                                      ? "border-[#FF6B35]/50 bg-[#FF6B35]/10 text-[#FF6B35]"
                                      : "border-white/[0.06] text-[#64748B] hover:text-white"
                                  }`}
                                >
                                  &#128260; Super-sub
                                </button>
                              )}
                              <button
                                onClick={() => handleDraft(c.id)}
                                disabled={draftCyclist.isPending}
                                className="ml-auto rounded-lg bg-[#6366F1] px-4 py-1.5 text-[10px] font-bold text-white transition hover:bg-[#6366F1]/80 disabled:opacity-40"
                              >
                                {draftCyclist.isPending ? "..." : "Drafter"}
                              </button>
                            </div>
                          </m.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {myTeam.length >= ECONOMY.FANTASY_TEAM_SIZE && (
          <div className="mt-4 rounded-xl border border-[#00F5D4]/20 bg-[#00F5D4]/5 p-4 text-center">
            <p className="text-sm font-bold text-[#00F5D4]">&#10003; Équipe complète !</p>
            <p className="mt-1 text-[10px] text-[#64748B]">
              {hasCaptain ? "Capitaine assigné" : "⚠ Pas de capitaine"} —{" "}
              {hasSuperSub ? "Super-sub assigné" : "Pas de super-sub"}
            </p>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
