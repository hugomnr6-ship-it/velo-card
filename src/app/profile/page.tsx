import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Profil | VeloCard",
  description: "Ton profil et tes badges",
  openGraph: {
    title: "Profil | VeloCard",
    description: "Ton profil et tes badges",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Profil | VeloCard",
    description: "Ton profil et tes badges",
    images: ["/og-image.png"],
  },
};

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
