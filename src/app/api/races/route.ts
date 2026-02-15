import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const federation = searchParams.get("federation");
  const region = searchParams.get("region");
  const category = searchParams.get("category");
  const gender = searchParams.get("gender");
  const search = searchParams.get("search");
  const upcoming = searchParams.get("upcoming");
  const limit = parseInt(searchParams.get("limit") || "200");

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
    query = query.or(`name.ilike.%${search}%,location.ilike.%${search}%`);
  }

  const { data: races, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

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
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const {
    name, date, location, description,
    federation, category, gender,
    distance_km, elevation_gain,
    department, region, is_official, source_url,
  } = body;

  if (!name || !date || !location) {
    return Response.json(
      { error: "Nom, date et lieu sont requis" },
      { status: 400 },
    );
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

  if (!profile) {
    return Response.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const { data: race, error } = await supabaseAdmin
    .from("races")
    .insert({
      creator_id: profile.id,
      name: name.trim(),
      date,
      location: location.trim(),
      description: (description || "").trim(),
      federation: federation || "OTHER",
      category: category || "Seniors",
      gender: gender || "MIXTE",
      distance_km: distance_km || null,
      elevation_gain: elevation_gain || null,
      is_official: is_official || false,
      department: department || null,
      region: region || null,
      source_url: source_url || null,
      status: "upcoming",
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Auto-join creator
  await supabaseAdmin
    .from("race_entries")
    .insert({ race_id: race.id, user_id: profile.id });

  return Response.json(race, { status: 201 });
}
