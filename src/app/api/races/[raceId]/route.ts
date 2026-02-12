import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { raceId } = await params;

  const { data: currentProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

  // Fetch race with creator info
  const { data: race, error } = await supabaseAdmin
    .from("races")
    .select("*, creator:profiles!creator_id (username, avatar_url)")
    .eq("id", raceId)
    .single();

  if (error || !race) {
    return Response.json({ error: "Course introuvable" }, { status: 404 });
  }

  // Fetch participants
  const { data: entries } = await supabaseAdmin
    .from("race_entries")
    .select("user_id, joined_at")
    .eq("race_id", raceId)
    .order("joined_at", { ascending: true });

  const userIds = (entries || []).map((e: any) => e.user_id);

  // Fetch profiles and stats for participants
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

  const participants = (entries || []).map((e: any) => ({
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
    ...race,
    participants,
    is_creator: currentProfile?.id === race.creator_id,
    is_participant: userIds.includes(currentProfile?.id),
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { raceId } = await params;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

  const { data: race } = await supabaseAdmin
    .from("races")
    .select("creator_id")
    .eq("id", raceId)
    .single();

  if (!race) {
    return Response.json({ error: "Course introuvable" }, { status: 404 });
  }

  if (race.creator_id !== profile?.id) {
    return Response.json(
      { error: "Seul le créateur peut supprimer cette course" },
      { status: 403 },
    );
  }

  await supabaseAdmin.from("races").delete().eq("id", raceId);
  return Response.json({ success: true });
}
