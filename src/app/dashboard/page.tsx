import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { VeloCardWithButtonSkeleton } from "@/components/Skeleton";
import VeloCardSection from "./VeloCardSection";
import RouteAnalysisSection from "./RouteAnalysisSection";
import CommunitySection from "./CommunitySection";
import SignOutButton from "./SignOutButton";
import type { CardTier } from "@/types";

export default async function DashboardPage() {
  // 1. Auth check — server-side, no loading spinner
  const session = await getServerSession(authOptions);
  if (!session?.user?.accessToken) {
    redirect("/");
  }

  // 2. Quick Supabase query for cached tier (for RouteAnalysisSection styling)
  const { data: cachedStats } = await supabaseAdmin
    .from("user_stats")
    .select("tier")
    .eq("user_id", session.user.id)
    .single();

  const cachedTier: CardTier = (cachedStats?.tier as CardTier) ?? "bronze";

  // 3. Extract user info for VeloCardSection (accessToken stays on server)
  const userInfo = {
    name: session.user.name ?? "Cycliste",
    image: session.user.image ?? null,
    stravaId: session.user.stravaId,
    accessToken: session.user.accessToken,
  };

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 px-4 py-12">
      {/* ——— VeloCard: skeleton appears instantly, card streams in when ready ——— */}
      <Suspense fallback={<VeloCardWithButtonSkeleton />}>
        <VeloCardSection userInfo={userInfo} />
      </Suspense>

      {/* ——— Route Analysis: renders immediately (no data dependency) ——— */}
      <RouteAnalysisSection tier={cachedTier} />

      {/* ——— Community: renders immediately ——— */}
      <CommunitySection />

      {/* ——— Sign out ——— */}
      <SignOutButton />
    </main>
  );
}
