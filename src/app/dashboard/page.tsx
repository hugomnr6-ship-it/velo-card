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

  // Check if user has completed onboarding
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

  if (profile) {
    const { data: stats } = await supabaseAdmin
      .from("user_stats")
      .select("has_onboarded")
      .eq("user_id", profile.id)
      .single();

    // Only redirect to onboarding if has_onboarded is explicitly false
    // null (no row) or true both allow access to dashboard
    if (stats && stats.has_onboarded === false) {
      redirect("/onboarding");
    }
  } else {
    // No profile yet — redirect to onboarding which will trigger sync
    redirect("/onboarding");
  }

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
