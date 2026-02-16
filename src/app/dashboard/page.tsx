import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { VeloCardWithButtonSkeleton } from "@/components/Skeleton";
import AnimatedPage from "@/components/AnimatedPage";
import VeloCardSection from "./VeloCardSection";
import SignOutButton from "./SignOutButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.accessToken) {
    redirect("/");
  }

  // Look up profile by UUID first (reliable), fall back to strava_id
  let profile: { id: string } | null = null;
  if (session.user.id) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", session.user.id)
      .single();
    profile = data;
  }
  if (!profile && session.user.stravaId) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("strava_id", session.user.stravaId)
      .single();
    profile = data;
  }

  if (!profile) {
    // Tout nouveau user sans profil → onboarding
    redirect("/onboarding");
  }

  // Vérifier si le user a déjà des stats (= a déjà sync au moins une fois)
  const { data: stats } = await supabaseAdmin
    .from("user_stats")
    .select("ovr")
    .eq("user_id", profile.id)
    .single();

  if (!stats) {
    // Pas de stats du tout → premier passage, onboarding
    redirect("/onboarding");
  }

  // Si on arrive ici, le user a un profil ET des stats → dashboard direct

  const userInfo = {
    name: session.user.name ?? "Cycliste",
    image: session.user.image ?? null,
    stravaId: session.user.stravaId,
    accessToken: session.user.accessToken,
  };

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 px-4 pb-24 pt-12">
      <AnimatedPage>
        <div className="flex flex-col items-center gap-6">
          <Suspense fallback={<VeloCardWithButtonSkeleton />}>
            <VeloCardSection userInfo={userInfo} />
          </Suspense>
          <SignOutButton />
        </div>
      </AnimatedPage>
    </main>
  );
}
