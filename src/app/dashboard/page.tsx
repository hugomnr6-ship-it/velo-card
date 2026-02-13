import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { VeloCardWithButtonSkeleton } from "@/components/Skeleton";
import VeloCardSection from "./VeloCardSection";
import SignOutButton from "./SignOutButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.accessToken) {
    redirect("/");
  }

  const userInfo = {
    name: session.user.name ?? "Cycliste",
    image: session.user.image ?? null,
    stravaId: session.user.stravaId,
    accessToken: session.user.accessToken,
  };

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 px-4 pb-24 pt-12">
      {/* ——— VeloCard ——— */}
      <Suspense fallback={<VeloCardWithButtonSkeleton />}>
        <VeloCardSection userInfo={userInfo} />
      </Suspense>

      {/* ——— Sign out ——— */}
      <SignOutButton />
    </main>
  );
}
