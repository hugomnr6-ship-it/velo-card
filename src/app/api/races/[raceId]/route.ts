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
      .select('user_id, pac, "end", mon, tier')
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
    mon: statsMap[e.user_id]?.mon || 0,
    tier: statsMap[e.user_id]?.tier || "bronze",
    joined_at: e.joined_at,
  }));

  // Build results if published
  let results: any[] = [];
  const resultsPublished = !!race.results_published;

  if (resultsPublished) {
    const { data: raceResults } = await supabaseAdmin
      .from("race_results")
      .select("position, rider_name, finish_time, gen_score, ghost_id, user_id")
      .eq("race_id", raceId)
      .order("position", { ascending: true });

    if (raceResults && raceResults.length > 0) {
      // Collect user_ids and ghost_ids for batch lookup
      const resultUserIds = raceResults
        .filter((r: any) => r.user_id)
        .map((r: any) => r.user_id);
      const ghostIds = raceResults
        .filter((r: any) => r.ghost_id)
        .map((r: any) => r.ghost_id);

      // Fetch avatars for real users
      const resultProfiles: Record<string, any> = {};
      if (resultUserIds.length > 0) {
        const { data: rp } = await supabaseAdmin
          .from("profiles")
          .select("id, avatar_url")
          .in("id", resultUserIds);
        for (const p of rp || []) resultProfiles[p.id] = p;
      }

      // Fetch ghost claim tokens + tiers
      const ghostMap: Record<string, any> = {};
      if (ghostIds.length > 0) {
        const { data: ghosts } = await supabaseAdmin
          .from("ghost_profiles")
          .select("id, claim_token, tier, claimed_by")
          .in("id", ghostIds);
        for (const g of ghosts || []) ghostMap[g.id] = g;
      }

      // Fetch user_stats for tier info of real users
      const resultStats: Record<string, any> = {};
      if (resultUserIds.length > 0) {
        const { data: rs } = await supabaseAdmin
          .from("user_stats")
          .select("user_id, tier")
          .in("user_id", resultUserIds);
        for (const s of rs || []) resultStats[s.user_id] = s;
      }

      results = raceResults.map((r: any) => {
        const isGhost = !!r.ghost_id && !ghostMap[r.ghost_id]?.claimed_by;
        return {
          position: r.position,
          rider_name: r.rider_name,
          finish_time: r.finish_time,
          gen_score: r.gen_score,
          is_ghost: isGhost,
          ghost_claim_token: ghostMap[r.ghost_id]?.claim_token || null,
          avatar_url: r.user_id ? resultProfiles[r.user_id]?.avatar_url || null : null,
          tier: r.ghost_id
            ? ghostMap[r.ghost_id]?.tier || "bronze"
            : resultStats[r.user_id]?.tier || "bronze",
          user_id: r.user_id,
        };
      });
    }
  }

  return Response.json({
    ...race,
    participants,
    results,
    results_published: resultsPublished,
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
