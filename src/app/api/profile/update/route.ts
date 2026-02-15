import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifie" }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

  if (!profile) {
    return Response.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const body = await request.json();
  const { bio, favorite_climb, bike_name, region } = body;

  // Validation
  const updates: Record<string, string> = {};

  if (bio !== undefined) {
    const trimmed = String(bio).trim().slice(0, 160);
    updates.bio = trimmed;
  }
  if (favorite_climb !== undefined) {
    updates.favorite_climb = String(favorite_climb).trim().slice(0, 100);
  }
  if (bike_name !== undefined) {
    updates.bike_name = String(bike_name).trim().slice(0, 80);
  }
  if (region !== undefined) {
    updates.region = String(region).trim();
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "Rien a modifier" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("id", profile.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
