"use client";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`shimmer rounded-lg bg-[#1A1A2E] ${className}`}
    />
  );
}

/* ——— Pre-built skeleton layouts ——— */

/** Skeleton that mimics the VeloCard shape */
export function VeloCardSkeleton() {
  return (
    <div className="relative w-full max-w-[280px] aspect-[280/470] rounded-2xl border border-white/[0.06] bg-[#111827] overflow-hidden">
      <div className="flex h-full flex-col items-center px-6 pt-6 pb-5">
        {/* Top bar */}
        <div className="flex w-full items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        {/* Avatar */}
        <div className="mt-8 flex flex-col items-center">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="mt-4 h-5 w-32" />
          <Skeleton className="mt-2 h-3 w-20" />
        </div>

        {/* Divider */}
        <Skeleton className="mt-6 h-px w-full" />

        {/* Stats row */}
        <div className="mt-8 flex w-full justify-center gap-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[100px] w-[90px]" />
          ))}
        </div>

        {/* Locked stats row */}
        <div className="mt-5 flex w-full justify-center gap-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[100px] w-[90px] opacity-30" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Skeleton for the download button */
export function ButtonSkeleton() {
  return <Skeleton className="h-12 w-64 rounded-full" />;
}

/** Combined skeleton for VeloCard + Download button (Suspense fallback) */
export function VeloCardWithButtonSkeleton() {
  return (
    <>
      <VeloCardSkeleton />
      <ButtonSkeleton />
    </>
  );
}

/** Skeleton for clubs page */
export function ClubsSkeleton() {
  return (
    <div className="w-full max-w-2xl">
      <Skeleton className="mb-6 h-8 w-32" />
      <Skeleton className="mb-6 h-32 w-full rounded-xl" />
      <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
      <Skeleton className="mb-3 h-4 w-24" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="mb-3 h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** Skeleton for wars page */
export function WarsSkeleton() {
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex w-full items-center justify-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
      <Skeleton className="mt-2 h-4 w-40" />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

/** Skeleton for leaderboard page */
export function LeaderboardSkeleton() {
  return (
    <div className="w-full max-w-2xl">
      <Skeleton className="mb-6 h-8 w-56" />
      <Skeleton className="mb-4 h-4 w-20" />
      <Skeleton className="mb-4 h-10 w-full rounded-lg" />
      <div className="mb-4 flex gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-9 flex-1 rounded-lg" />
        ))}
      </div>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Skeleton key={i} className="mb-2 h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** Skeleton for races page */
export function RacesSkeleton() {
  return (
    <div className="w-full max-w-2xl">
      <Skeleton className="mb-6 h-8 w-32" />
      <Skeleton className="mb-6 h-48 w-full rounded-xl" />
      <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <Skeleton className="mb-4 h-4 w-32" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="mb-3 h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** Skeleton for the full page loading state — matches real dashboard layout */
export function DashboardSkeleton() {
  return (
    <main role="status" aria-label="Chargement du tableau de bord" className="flex min-h-screen flex-col items-center gap-6 px-4 py-12">
      {/* VeloCard skeleton */}
      <VeloCardSkeleton />
      <ButtonSkeleton />

      {/* Phase 2: Analyse de parcours skeleton */}
      <section className="mt-8 w-full max-w-2xl">
        <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <Skeleton className="mx-auto mb-4 h-6 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </section>

      {/* Phase 3: Communauté skeleton */}
      <section className="mt-8 w-full max-w-2xl">
        <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <Skeleton className="mx-auto mb-4 h-6 w-36" />
        <Skeleton className="mb-5 h-10 w-48" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </section>

      {/* Sign out skeleton */}
      <Skeleton className="mt-4 h-5 w-32" />
    </main>
  );
}
