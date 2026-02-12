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

/** Skeleton for the full page loading state */
export function DashboardSkeleton() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-6 px-4 py-12">
      <VeloCardSkeleton />
      <ButtonSkeleton />
    </main>
  );
}
