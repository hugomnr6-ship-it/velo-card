import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { computeBadges } from "@/lib/badges";
import type { ComputedStats, CardTier, ClubInfo } from "@/types";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.accessToken) {
    redirect("/");
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("strava_id", session.user.stravaId)
    .single();

  if (!profile) {
    redirect("/dashboard");
  }

  // Fetch stats
  const { data: statsRow } = await supabaseAdmin
    .from("user_stats")
    .select('pac, "end", mon, res, spr, val, ovr, tier')
    .eq("user_id", profile.id)
    .single();

  const stats: ComputedStats = {
    pac: statsRow?.pac || 0,
    end: statsRow?.end || 0,
    mon: statsRow?.mon || 0,
    res: statsRow?.res || 0,
    spr: statsRow?.spr || 0,
    val: statsRow?.val || 0,
    ovr: statsRow?.ovr || 0,
  };

  const tier: CardTier = (statsRow?.tier as CardTier) || "bronze";
  const badges = computeBadges(stats);

  // Fetch clubs
  const { data: memberRows } = await supabaseAdmin
    .from("club_members")
    .select("club_id")
    .eq("user_id", profile.id);

  let clubs: ClubInfo[] = [];
  if (memberRows && memberRows.length > 0) {
    const clubIds = memberRows.map((m: any) => m.club_id);
    const { data: clubRows } = await supabaseAdmin
      .from("clubs")
      .select("name, logo_url")
      .in("id", clubIds);
    clubs = (clubRows || [])
      .filter((c: any) => c.logo_url)
      .map((c: any) => ({ name: c.name, logo_url: c.logo_url }));
  }

  const avatarUrl = session.user.image || profile.avatar_url || null;

  return (
    <ProfileClient
      username={profile.username}
      avatarUrl={avatarUrl}
      stats={stats}
      tier={tier}
      badges={badges}
      clubs={clubs}
      userId={profile.id}
    />
  );
}
