import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifie" }, { status: 401 });
  }

  const { clubId } = await params;

  const { data: currentProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

  // Fetch club with creator
  const { data: club, error } = await supabaseAdmin
    .from("clubs")
    .select("*, creator:profiles!creator_id (username, avatar_url)")
    .eq("id", clubId)
    .single();

  if (error || !club) {
    return Response.json({ error: "Club introuvable" }, { status: 404 });
  }

  // Fetch members
  const { data: entries } = await supabaseAdmin
    .from("club_members")
    .select("user_id, joined_at")
    .eq("club_id", clubId)
    .order("joined_at", { ascending: true });

  const userIds = (entries || []).map((e: any) => e.user_id);

  let profiles: any[] = [];
  let stats: any[] = [];
  if (userIds.length > 0) {
    const { data: p } = await supabaseAdmin
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);
    profiles = p || [];

    const { data: s } = await supabaseAdmin
      .from("user_stats")
      .select('user_id, pac, "end", grim, tier')
      .in("user_id", userIds);
    stats = s || [];
  }

  const profileMap: Record<string, any> = {};
  for (const p of profiles) profileMap[p.id] = p;
  const statsMap: Record<string, any> = {};
  for (const s of stats) statsMap[s.user_id] = s;

  const members = (entries || []).map((e: any) => ({
    user_id: e.user_id,
    username: profileMap[e.user_id]?.username || "Inconnu",
    avatar_url: profileMap[e.user_id]?.avatar_url || null,
    pac: statsMap[e.user_id]?.pac || 0,
    end: statsMap[e.user_id]?.end || 0,
    grim: statsMap[e.user_id]?.grim || 0,
    tier: statsMap[e.user_id]?.tier || "bronze",
    joined_at: e.joined_at,
  }));

  return Response.json({
    ...club,
    members,
    is_creator: currentProfile?.id === club.creator_id,
    is_member: userIds.includes(currentProfile?.id),
  });
}
