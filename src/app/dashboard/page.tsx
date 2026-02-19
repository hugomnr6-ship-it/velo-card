import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { VeloCardWithButtonSkeleton } from "@/components/Skeleton";
import AnimatedPage from "@/components/AnimatedPage";
import NotificationBell from "@/components/NotificationBell";
import VeloCardSection from "./VeloCardSection";
import SignOutButton from "./SignOutButton";

export const metadata: Metadata = {
  title: "Dashboard | VeloCard",
  description: "Ta carte de cycliste — stats, duels, classement",
  openGraph: {
    title: "Dashboard | VeloCard",
    description: "Ta carte de cycliste — stats, duels, classement",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dashboard | VeloCard",
    description: "Ta carte de cycliste — stats, duels, classement",
    images: ["/og-image.png"],
  },
};

export default async function DashboardPage() {
  const session = await auth();
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
      {/* Notification Bell — top right */}
      <div className="fixed top-4 right-4 z-40">
        <NotificationBell />
      </div>
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
