"use client";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-neutral-800 ${className}`}
    />
  );
}

/* ——— Pre-built skeleton layouts ——— */

/** Skeleton that mimics the VeloCard shape */
export function VeloCardSkeleton() {
  return (
    <div className="relative w-[400px] h-[711px] rounded-2xl border border-neutral-700/50 bg-neutral-900 overflow-hidden">
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

/** Skeleton for the full page loading state — matches real dashboard layout */
export function DashboardSkeleton() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-6 px-4 py-12">
      {/* VeloCard skeleton */}
      <VeloCardSkeleton />
      <ButtonSkeleton />

      {/* Phase 2: Analyse de parcours skeleton */}
      <section className="mt-8 w-full max-w-2xl">
        <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
        <Skeleton className="mx-auto mb-4 h-6 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </section>

      {/* Phase 3: Communauté skeleton */}
      <section className="mt-8 w-full max-w-2xl">
        <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
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
