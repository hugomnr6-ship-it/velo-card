import Skeleton from "@/components/Skeleton";

export default function ProfileLoading() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-8">
      <div className="w-full max-w-lg flex flex-col items-center gap-4">
        {/* Avatar */}
        <Skeleton className="h-24 w-24 rounded-full" />
        {/* Username */}
        <Skeleton className="h-6 w-40" />
        {/* Bio */}
        <Skeleton className="h-4 w-56" />
        {/* Stats row */}
        <div className="mt-4 grid w-full grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        {/* Badges */}
        <Skeleton className="mt-4 h-4 w-24" />
        <div className="grid w-full grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    </main>
  );
}
