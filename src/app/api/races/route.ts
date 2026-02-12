import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Fetch upcoming races with creator info
  const { data: races, error } = await supabaseAdmin
    .from("races")
    .select("*, creator:profiles!creator_id (username, avatar_url)")
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Get participant counts for each race
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
  const { name, date, location, description } = body;

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
