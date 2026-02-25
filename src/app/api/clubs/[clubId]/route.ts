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

  // N+1 FIX: 1 seule requête avec JOINs — inclut sharing_consent pour le filtrage
  const { data: club, error } = await supabaseAdmin
    .from("clubs")
    .select(`
      *,
      creator:profiles!creator_id (username, avatar_url),
      members:club_members (
        user_id,
        role,
        joined_at,
        profile:profiles (id, username, avatar_url, region, sharing_consent),
        stats:user_stats (ovr, tier, pac, mon, "end")
      )
    `)
    .eq("id", clubId)
    .single();

  if (error || !club) {
    return Response.json({ error: "Club introuvable" }, { status: 404 });
  }

  // Conditionner les stats au consentement de chaque membre
  const membersList = ((club as any).members || []).map((m: any) => {
    const hasConsent = m.profile?.sharing_consent === true;
    return {
      user_id: m.user_id,
      username: m.profile?.username || "Inconnu",
      avatar_url: m.profile?.avatar_url || null,
      // Stats uniquement si le membre a consenti au partage
      ...(hasConsent ? {
        pac: m.stats?.pac || 0,
        end: m.stats?.end || 0,
        mon: m.stats?.mon || 0,
        ovr: m.stats?.ovr || 0,
        tier: m.stats?.tier || "bronze",
      } : {
        tier: "bronze" as const,
      }),
      joined_at: m.joined_at,
      role: m.role,
    };
  });

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
