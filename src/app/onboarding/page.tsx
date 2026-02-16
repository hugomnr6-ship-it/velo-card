import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.accessToken) {
    redirect("/");
  }

  // Check if user already onboarded — look up by UUID first, fall back to strava_id
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

  if (profile) {
    const { data: stats } = await supabaseAdmin
      .from("user_stats")
      .select("has_onboarded, ovr")
      .eq("user_id", profile.id)
      .single();

    // User déjà onboardé OU user existant avec des stats → dashboard
    if (stats && (stats.has_onboarded || stats.ovr > 0)) {
      redirect("/dashboard");
    }
  }

  return (
    <OnboardingClient
      userName={session.user.name ?? "Cycliste"}
      userImage={session.user.image ?? null}
      accessToken={session.user.accessToken}
    />
  );
}
