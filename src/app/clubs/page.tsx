"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CreateClubForm from "@/components/CreateClubForm";
import { useToast } from "@/contexts/ToastContext";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { AnimatedList, AnimatedListItem } from "@/components/AnimatedList";
import { ClubsSkeleton } from "@/components/Skeleton";
import Skeleton from "@/components/Skeleton";
import { ShieldIcon } from "@/components/icons/TabIcons";
import type { ClubWithCount, ClubMember } from "@/types";

export default function ClubsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [clubs, setClubs] = useState<ClubWithCount[]>([]);
  const [userClubIds, setUserClubIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [clubDetail, setClubDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (session) fetchClubs();
  }, [session]);

  async function fetchClubs() {
    setLoading(true);
    try {
      const q = search ? `?q=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/clubs${q}`);
      if (res.ok) {
        const data = await res.json();
        setClubs(data.clubs);
        setUserClubIds(data.userClubIds || []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchClubs();
  }

  async function openDetail(clubId: string) {
    setSelectedClubId(clubId);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}`);
      if (res.ok) {
        setClubDetail(await res.json());
      }
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleJoin(clubId: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/join`, { method: "POST" });
      if (res.ok) {
        toast("Club rejoint !", "success");
        await fetchClubs();
        await openDetail(clubId);
      } else {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "Erreur", "error");
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLeave(clubId: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/leave`, { method: "POST" });
      if (res.ok) {
        toast("Club quitte", "info");
        setSelectedClubId(null);
        setClubDetail(null);
        await fetchClubs();
      } else {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "Erreur", "error");
      }
    } finally {
      setActionLoading(false);
    }
  }

  if (status === "loading" || !session) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <ClubsSkeleton />
      </main>
    );
  }

  const myClubs = clubs.filter((c) => userClubIds.includes(c.id));
  const otherClubs = clubs.filter((c) => !userClubIds.includes(c.id));

  return (
    <AnimatedPage className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <div className="w-full max-w-2xl">
        <PageHeader icon={<ShieldIcon size={28} />} title="Clubs" subtitle="Rejoins un peloton" />

        {/* Club detail modal */}
        {selectedClubId && (
          <div className="mb-6 rounded-xl border border-neutral-700/50 bg-neutral-800/80 p-5">
            {detailLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-8 w-32 rounded-lg" />
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : clubDetail ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {clubDetail.logo_url && (
                      <img
                        src={clubDetail.logo_url}
                        alt={clubDetail.name}
                        className="h-12 w-12 rounded-full border border-neutral-600 object-cover"
                      />
                    )}
                    <div>
                      <p className="font-bold text-white">{clubDetail.name}</p>
                      <p className="text-xs text-neutral-500">
                        Cree par {clubDetail.creator?.username}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedClubId(null);
                      setClubDetail(null);
                    }}
                    className="text-sm text-neutral-500 hover:text-neutral-300"
                  >
                    Fermer
                  </button>
                </div>

                <div className="mt-4 flex gap-2">
                  {clubDetail.is_member ? (
                    !clubDetail.is_creator && (
                      <button
                        onClick={() => handleLeave(selectedClubId)}
                        disabled={actionLoading}
                        className="rounded-lg border border-red-800/50 bg-red-900/30 px-4 py-1.5 text-sm text-red-400 transition hover:bg-red-900/50 disabled:opacity-50"
                      >
                        {actionLoading ? "..." : "Quitter le club"}
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleJoin(selectedClubId)}
                      disabled={actionLoading}
                      className="rounded-lg bg-white px-4 py-1.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                    >
                      {actionLoading ? "..." : "Rejoindre"}
                    </button>
                  )}
                </div>

                <p className="mt-5 mb-3 text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Membres ({clubDetail.members?.length || 0})
                </p>
                <AnimatedList className="flex flex-col gap-2">
                  {(clubDetail.members || []).map((m: ClubMember) => (
                    <AnimatedListItem key={m.user_id}>
                      <div className="flex items-center gap-3 rounded-lg bg-neutral-900/50 px-3 py-2">
                        {m.avatar_url ? (
                          <img
                            src={m.avatar_url}
                            alt=""
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-neutral-700" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            {m.username}
                          </p>
                          <p className="text-[10px] text-neutral-500">
                            PAC {m.pac} / END {m.end} / MON {m.mon}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider ${
                            m.tier === "legende"
                              ? "bg-yellow-900/30 text-yellow-400"
                              : m.tier === "diamant"
                                ? "bg-cyan-900/30 text-[#B9F2FF]"
                                : m.tier === "platine"
                                  ? "bg-sky-900/30 text-[#A8D8EA]"
                                  : m.tier === "argent"
                                    ? "bg-slate-700/30 text-slate-300"
                                    : "bg-amber-900/30 text-amber-500"
                          }`}
                        >
                          {m.tier.toUpperCase()}
                        </span>
                      </div>
                    </AnimatedListItem>
                  ))}
                </AnimatedList>
              </>
            ) : null}
          </div>
        )}

        <CreateClubForm onCreated={() => fetchClubs()} />

        <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />

        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un club..."
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-neutral-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-neutral-700 px-4 py-2 text-sm text-white transition hover:bg-neutral-600"
          >
            Chercher
          </button>
        </form>

        {myClubs.length > 0 && (
          <>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-neutral-500">
              Mes clubs
            </h2>
            <AnimatedList className="mb-6 flex flex-col gap-3">
              {myClubs.map((club) => (
                <AnimatedListItem key={club.id}>
                  <ClubCard
                    club={club}
                    isMember
                    onOpen={() => openDetail(club.id)}
                  />
                </AnimatedListItem>
              ))}
            </AnimatedList>
          </>
        )}

        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-neutral-500">
          {myClubs.length > 0 ? "Autres clubs" : "Clubs disponibles"}
        </h2>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : otherClubs.length === 0 ? (
          <EmptyState
            icon={<ShieldIcon size={48} />}
            title={search ? "Aucun resultat" : "Aucun club"}
            description={
              search
                ? "Aucun club ne correspond a ta recherche."
                : "Aucun club pour le moment. Cree le premier !"
            }
          />
        ) : (
          <AnimatedList className="flex flex-col gap-3">
            {otherClubs.map((club) => (
              <AnimatedListItem key={club.id}>
                <ClubCard
                  club={club}
                  isMember={false}
                  onOpen={() => openDetail(club.id)}
                />
              </AnimatedListItem>
            ))}
          </AnimatedList>
        )}
      </div>
    </AnimatedPage>
  );
}

/* ——— Club card (inline component) ——— */
function ClubCard({
  club,
  isMember,
  onOpen,
}: {
  club: ClubWithCount;
  isMember: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="block w-full rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-4 text-left transition hover:border-neutral-500 hover:bg-neutral-700/50"
    >
      <div className="flex items-center gap-3">
        {club.logo_url ? (
          <img
            src={club.logo_url}
            alt={club.name}
            className="h-10 w-10 rounded-full border border-neutral-600 object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700">
            <ShieldIcon size={20} />
          </div>
        )}
        <div className="flex-1">
          <p className="font-bold text-white">{club.name}</p>
          <p className="text-xs text-neutral-500">
            {club.creator?.username && `Cree par ${club.creator.username}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isMember && (
            <span className="rounded-full bg-green-900/30 px-2 py-0.5 text-[10px] font-bold text-green-400">
              MEMBRE
            </span>
          )}
          <span className="rounded-full bg-neutral-700/50 px-2.5 py-0.5 text-xs text-neutral-300">
            {club.member_count} membre{club.member_count !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </button>
  );
}
