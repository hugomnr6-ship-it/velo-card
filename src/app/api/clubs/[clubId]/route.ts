import { getAuthenticatedUser, isErrorResponse, isValidUUID } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const { clubId } = await params;
  if (!isValidUUID(clubId)) {
    return Response.json({ error: "ID invalide" }, { status: 400 });
  }

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
      .select('user_id, pac, "end", mon, tier')
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
    mon: statsMap[e.user_id]?.mon || 0,
    tier: statsMap[e.user_id]?.tier || "bronze",
    joined_at: e.joined_at,
  }));

  return Response.json({
    ...club,
    members,
    is_creator: profileId === club.creator_id,
    is_member: userIds.includes(profileId),
  });
}
