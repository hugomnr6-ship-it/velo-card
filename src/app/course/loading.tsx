import Skeleton from "@/components/Skeleton";

export default function CourseLoading() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 pb-24 pt-6">
      <div className="w-full max-w-lg">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-3 h-32 w-full rounded-xl" />
      </div>
    </main>
  );
}
