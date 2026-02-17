"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import { useCreateLeague } from "@/hooks/useFantasy";
import { useToast } from "@/contexts/ToastContext";

export default function CreateFantasyLeaguePage() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const createLeague = useCreateLeague();

  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [entryFee, setEntryFee] = useState(0);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [durationWeeks, setDurationWeeks] = useState<"4" | "8">("4");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  async function handleCreate() {
    if (!name.trim()) {
      toast("Nom requis", "error");
      return;
    }
    try {
      const league = await createLeague.mutateAsync({
        name: name.trim(),
        isPublic,
        entryFee,
        maxParticipants,
        durationWeeks,
      });
      toast("Ligue créée !", "success");
      router.push(`/fantasy/${league.id}`);
    } catch (err: any) {
      toast(err.message || "Erreur création", "error");
    }
  }

  if (status === "loading") return null;

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
          title="Créer une ligue"
          subtitle="Fantasy Cycling"
        />

        <div className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[#94A3B8]">
              Nom de la ligue
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ma ligue Fantasy"
              maxLength={50}
              className="w-full rounded-xl border border-white/10 bg-[#1A1A2E]/60 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-[#6366F1]/50 focus:outline-none"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[#94A3B8]">
              Durée
            </label>
            <div className="flex gap-2">
              {(["4", "8"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDurationWeeks(d)}
                  className={`flex-1 rounded-xl border py-3 text-sm font-bold transition ${
                    durationWeeks === d
                      ? "border-[#6366F1]/50 bg-[#6366F1]/10 text-[#6366F1]"
                      : "border-white/[0.06] bg-[#1A1A2E]/60 text-[#94A3B8] hover:text-white"
                  }`}
                >
                  {d} semaines
                </button>
              ))}
            </div>
          </div>

          {/* Max participants */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[#94A3B8]">
              Joueurs max ({maxParticipants})
            </label>
            <input
              type="range"
              min={4}
              max={20}
              step={1}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              className="w-full accent-[#6366F1]"
            />
            <div className="flex justify-between text-[10px] text-[#64748B]">
              <span>4</span>
              <span>20</span>
            </div>
          </div>

          {/* Entry fee */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[#94A3B8]">
              Droit d&apos;entrée (VeloCoins)
            </label>
            <div className="flex gap-2">
              {[0, 25, 50, 100, 200].map((fee) => (
                <button
                  key={fee}
                  onClick={() => setEntryFee(fee)}
                  className={`flex-1 rounded-lg border py-2 text-xs font-bold transition ${
                    entryFee === fee
                      ? "border-[#FFD700]/50 bg-[#FFD700]/10 text-[#FFD700]"
                      : "border-white/[0.06] bg-[#1A1A2E]/60 text-[#64748B] hover:text-white"
                  }`}
                >
                  {fee === 0 ? "Gratuit" : fee}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-white">Ligue publique</p>
              <p className="text-[10px] text-[#64748B]">
                Visible par tous dans la liste
              </p>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`relative h-6 w-11 rounded-full transition ${
                isPublic ? "bg-[#6366F1]" : "bg-white/10"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition ${
                  isPublic ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-white/[0.06] bg-[#1A1A2E]/40 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
              Résumé
            </p>
            <div className="flex flex-col gap-1 text-xs text-[#94A3B8]">
              <span>&#128100; {maxParticipants} joueurs max</span>
              <span>&#128197; {durationWeeks} semaines</span>
              <span>&#128176; {entryFee > 0 ? `${entryFee} coins d'entrée → Prize pool: ${entryFee * maxParticipants}` : "Gratuit"}</span>
              <span>{isPublic ? "&#127760; Publique" : "&#128274; Privée (code invitation)"}</span>
            </div>
          </div>

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={createLeague.isPending || !name.trim()}
            className="w-full rounded-xl bg-[#6366F1] py-4 text-sm font-bold text-white transition hover:bg-[#6366F1]/80 disabled:opacity-40"
          >
            {createLeague.isPending ? "Création..." : "Créer la ligue"}
          </button>
        </div>
      </div>
    </AnimatedPage>
  );
}
