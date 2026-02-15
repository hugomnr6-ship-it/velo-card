import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { computeGenScore, getGhostTier, generateClaimToken } from "@/lib/ghost-score";
import { insertFeedEvent } from "@/lib/feed";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { raceId } = await params;

  // Get current user profile
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

  if (!profile) {
    return Response.json({ error: "Profil introuvable" }, { status: 404 });
  }

  // Verify race exists and user is creator
  const { data: race } = await supabaseAdmin
    .from("races")
    .select("id, creator_id, results_published")
    .eq("id", raceId)
    .single();

  if (!race) {
    return Response.json({ error: "Course introuvable" }, { status: 404 });
  }

  if (race.creator_id !== profile.id) {
    return Response.json(
      { error: "Seul le créateur peut publier les résultats" },
      { status: 403 },
    );
  }

  // If results already published, delete old results + ghosts before re-inserting
  if (race.results_published) {
    // Delete old ghost_profiles for this race (cascade will handle race_results.ghost_id)
    await supabaseAdmin.from("ghost_profiles").delete().eq("race_id", raceId);
    // Delete old race_results
    await supabaseAdmin.from("race_results").delete().eq("race_id", raceId);
  }

  // Parse request body
  const body = await request.json();
  const results: { position: number; rider_name: string; finish_time: number }[] = body.results;
  const raceTime: number = Number(body.race_time) || 0;   // seconds
  const avgSpeed: number = Number(body.avg_speed) || 0;    // km/h

  if (!results || !Array.isArray(results) || results.length === 0) {
    return Response.json({ error: "Résultats manquants" }, { status: 400 });
  }

  // Validate all results
  for (const r of results) {
    if (!r.rider_name || !r.position) {
      return Response.json(
        { error: `Résultat invalide pour la position ${r.position}` },
        { status: 400 },
      );
    }
    // Ensure finish_time is a number (default 0)
    if (r.finish_time === undefined || r.finish_time === null) {
      r.finish_time = 0;
    }
  }

  // Compute best time and total riders (only from riders with a time)
  const timesOnly = results.filter((r) => r.finish_time > 0).map((r) => r.finish_time);
  const bestTime = timesOnly.length > 0 ? Math.min(...timesOnly) : 0;
  const totalRiders = results.length;

  // Fetch all existing profiles (for matching rider names)
  const { data: allProfiles } = await supabaseAdmin
    .from("profiles")
    .select("id, username");

  const profilesByName: Record<string, { id: string; username: string }> = {};
  for (const p of allProfiles || []) {
    profilesByName[p.username.toLowerCase()] = p;
  }

  let ghostCount = 0;
  const raceResultsToInsert: any[] = [];
  const ghostsToInsert: any[] = [];

  for (const r of results) {
    const genScore = computeGenScore(r.position, r.finish_time, totalRiders, bestTime);
    const tier = getGhostTier(genScore);

    // Try to match with an existing profile
    const matchedProfile = profilesByName[r.rider_name.toLowerCase()];

    if (matchedProfile) {
      // Known user — no ghost
      raceResultsToInsert.push({
        race_id: raceId,
        position: r.position,
        rider_name: r.rider_name,
        finish_time: r.finish_time,
        gen_score: genScore,
        ghost_id: null,
        user_id: matchedProfile.id,
      });
    } else {
      // Unknown rider — create ghost card for ALL unmatched riders
      const claimToken = generateClaimToken();
      ghostsToInsert.push({
        race_id: raceId,
        rider_name: r.rider_name,
        gen_score: genScore,
        tier,
        claim_token: claimToken,
        _position: r.position,
        _finish_time: r.finish_time,
      });
      ghostCount++;
    }
  }

  // Insert ghosts first (we need their IDs)
  if (ghostsToInsert.length > 0) {
    const ghostRows = ghostsToInsert.map((g) => ({
      race_id: g.race_id,
      rider_name: g.rider_name,
      gen_score: g.gen_score,
      tier: g.tier,
      claim_token: g.claim_token,
    }));

    const { data: insertedGhosts, error: ghostError } = await supabaseAdmin
      .from("ghost_profiles")
      .insert(ghostRows)
      .select("id, claim_token");

    if (ghostError) {
      return Response.json({ error: "Erreur création fantômes: " + ghostError.message }, { status: 500 });
    }

    // Map inserted ghosts by claim_token
    const ghostMap: Record<string, string> = {};
    for (const g of insertedGhosts || []) {
      ghostMap[g.claim_token] = g.id;
    }

    // Create result rows for ghosts
    for (const g of ghostsToInsert) {
      raceResultsToInsert.push({
        race_id: raceId,
        position: g._position,
        rider_name: g.rider_name,
        finish_time: g._finish_time,
        gen_score: g.gen_score,
        ghost_id: ghostMap[g.claim_token] || null,
        user_id: null,
      });
    }
  }

  // Insert all race results
  const { error: resultsError } = await supabaseAdmin
    .from("race_results")
    .insert(raceResultsToInsert);

  if (resultsError) {
    return Response.json({ error: "Erreur insertion résultats: " + resultsError.message }, { status: 500 });
  }

  // Mark race as results_published + save race_time & avg_speed
  await supabaseAdmin
    .from("races")
    .update({
      results_published: true,
      race_time: raceTime,
      avg_speed: avgSpeed,
    })
    .eq("id", raceId);

  // Generate feed events for registered users who got results
  for (const r of raceResultsToInsert) {
    if (r.user_id) {
      const { data: raceInfo } = await supabaseAdmin.from("races").select("name").eq("id", raceId).single();
      insertFeedEvent(r.user_id, "race_result", {
        race_name: raceInfo?.name || "Course",
        position: r.position,
        total_riders: totalRiders,
        gen_score: r.gen_score,
      });
    }
  }

  return Response.json({ success: true, ghost_count: ghostCount });
}
