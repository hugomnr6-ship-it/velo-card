"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import AnimatedPage from "@/components/AnimatedPage";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import BookmarkButton from "@/components/BookmarkButton";
import Skeleton from "@/components/Skeleton";
import { useRoutes } from "@/hooks/useRoutes";
import { useToast } from "@/contexts/ToastContext";

// ——— Skeleton ———
function RoutesListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function ParcoursPage() {
  const { status } = useSession();
  const router = useRouter();
  const { routes, isLoading, deleteRoute } = useRoutes();
  const { toast } = useToast();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
        <div className="w-full max-w-lg">
          <Skeleton className="mb-6 h-12 w-48" />
          <RoutesListSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-12">
      <AnimatedPage className="w-full max-w-lg">
        <PageHeader
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
          }
          title="Mes parcours"
          subtitle="Tes parcours GPX sauvegardes"
        />

        {routes.length === 0 ? (
          <EmptyState
            icon="🗺️"
            title="Aucun parcours sauvegarde"
            description="Analyse un fichier GPX et sauvegarde-le pour le retrouver ici."
            action={{ label: "Analyser un GPX", href: "/course" }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {routes.map((route) => (
              <m.div
                key={route.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#1A1A2E]/60 p-3 transition hover:bg-[#22223A]/60"
              >
                {/* Icône */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#6366F1]/10">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6366F1]">
                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                  </svg>
                </div>

                {/* Info */}
                <Link href={`/course`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{route.name}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#64748B]">
                    <span>{route.distance_km} km</span>
                    <span>· D+ {route.elevation_gain}m</span>
                    {route.rdi_score && (
                      <span className={`font-bold ${
                        route.rdi_score >= 7 ? "text-red-400" :
                        route.rdi_score >= 4 ? "text-orange-400" :
                        "text-green-400"
                      }`}>
                        · RDI {route.rdi_score}
                      </span>
                    )}
                    {route.climb_count > 0 && <span>· {route.climb_count} col(s)</span>}
                  </div>
                  <p className="mt-0.5 text-[10px] text-[#475569]">
                    {new Date(route.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </Link>

                {/* Favori */}
                <BookmarkButton entityType="route" entityId={route.id} size="sm" />

                {/* Supprimer */}
                <button
                  onClick={() => {
                    deleteRoute.mutate(route.id, {
                      onSuccess: () => toast("Parcours supprime", "success"),
                      onError: () => toast("Erreur suppression", "error"),
                    });
                  }}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-[#475569] transition hover:bg-red-500/10 hover:text-red-400"
                  aria-label="Supprimer le parcours"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </m.div>
            ))}
          </div>
        )}
      </AnimatedPage>
    </main>
  );
}
