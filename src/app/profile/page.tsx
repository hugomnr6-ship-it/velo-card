import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * /profile — redirects authenticated user to their own profile page
 */
export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.accessToken) {
    redirect("/");
  }

  // Fast path: use userId from JWT if available
  if (session.user.id) {
    redirect(`/profile/${session.user.id}`);
  }

  // Fallback: lookup by strava_id
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

  if (!profile) {
    // Profile doesn't exist yet, send to dashboard (which will trigger onboarding)
    redirect("/dashboard");
  }

  redirect(`/profile/${profile.id}`);
}
