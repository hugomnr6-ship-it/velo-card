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

  // ═══ N+1 FIX: 1 seule requête avec JOINs au lieu de 4 requêtes séparées ═══
  const { data: club, error } = await supabaseAdmin
    .from("clubs")
    .select(`
      *,
      creator:profiles!creator_id (username, avatar_url),
      members:club_members (
        user_id,
        role,
        joined_at,
        profile:profiles (id, username, avatar_url, region),
        stats:user_stats (ovr, tier, pac, mon, "end")
      )
    `)
    .eq("id", clubId)
    .single();

  if (error || !club) {
    return Response.json({ error: "Club introuvable" }, { status: 404 });
  }

  const membersList = ((club as any).members || []).map((m: any) => ({
    user_id: m.user_id,
    username: m.profile?.username || "Inconnu",
    avatar_url: m.profile?.avatar_url || null,
    pac: m.stats?.pac || 0,
    end: m.stats?.end || 0,
    mon: m.stats?.mon || 0,
    tier: m.stats?.tier || "bronze",
    joined_at: m.joined_at,
    role: m.role,
  }));

  const userIds = membersList.map((m: any) => m.user_id);

  // Remove members from the club object before spreading
  const { members: _, ...clubData } = club as any;

  return Response.json({
    ...clubData,
    members: membersList,
    is_creator: profileId === club.creator_id,
    is_member: userIds.includes(profileId),
  });
}
