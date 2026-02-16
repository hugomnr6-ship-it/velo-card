import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { createRaceSchema, racesQuerySchema } from "@/schemas";

export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const validated = validateBody(racesQuerySchema, params);
  if (validated instanceof Response) return validated;
  const { federation, region, category, gender, search, upcoming, limit } = validated;

  let query = supabaseAdmin
    .from("races")
    .select("*, creator:profiles!creator_id (username, avatar_url)")
    .order("date", { ascending: true })
    .limit(limit);

  // Default: upcoming only
  if (upcoming !== "false") {
    query = query.gte("date", new Date().toISOString().split("T")[0]);
  }

  if (federation && federation !== "all") {
    query = query.eq("federation", federation);
  }
  if (region && region !== "all") {
    query = query.eq("region", region);
  }
  if (category && category !== "all") {
    query = query.eq("category", category);
  }
  if (gender && gender !== "all") {
    query = query.eq("gender", gender);
  }
  if (search) {
    // Sanitize search for Supabase ilike
    const sanitized = search.replace(/[%_\\]/g, '');
    query = query.or(`name.ilike.%${sanitized}%,location.ilike.%${sanitized}%`);
  }

  const { data: races, error } = await query;

  if (error) return handleApiError(error, "RACES_GET");

  // Get participant counts
  const raceIds = (races || []).map((r: any) => r.id);
  const { data: entries } = await supabaseAdmin
    .from("race_entries")
    .select("race_id")
    .in("race_id", raceIds.length > 0 ? raceIds : ["none"]);

  const countMap: Record<string, number> = {};
  for (const e of entries || []) {
    countMap[e.race_id] = (countMap[e.race_id] || 0) + 1;
  }

  const result = (races || []).map((r: any) => ({
    ...r,
    participant_count: countMap[r.id] || 0,
  }));

  return Response.json(result);
}

export async function POST(request: Request) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const body = await request.json();
  const raceValidated = validateBody(createRaceSchema, body);
  if (raceValidated instanceof Response) return raceValidated;

  const { data: race, error } = await supabaseAdmin
    .from("races")
    .insert({
      creator_id: profileId,
      name: raceValidated.name.trim(),
      date: raceValidated.date,
      location: raceValidated.location.trim(),
      description: raceValidated.description.trim(),
      federation: raceValidated.federation,
      category: raceValidated.category,
      gender: raceValidated.gender,
      distance_km: raceValidated.distance_km || null,
      elevation_gain: raceValidated.elevation_gain || null,
      is_official: raceValidated.is_official,
      department: raceValidated.department || null,
      region: raceValidated.region || null,
      source_url: raceValidated.source_url || null,
      status: "upcoming",
    })
    .select()
    .single();

  if (error) return handleApiError(error, "RACES_POST");

  // Auto-join creator
  await supabaseAdmin
    .from("race_entries")
    .insert({ race_id: race.id, user_id: profileId });

  return Response.json(race, { status: 201 });
}
