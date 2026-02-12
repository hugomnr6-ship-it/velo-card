import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { region } = await request.json();

  if (region !== null && typeof region !== "string") {
    return Response.json({ error: "Région invalide" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ region })
    .eq("strava_id", session.user.stravaId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, region });
}
