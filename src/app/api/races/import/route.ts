import { supabaseAdmin } from "@/lib/supabase";
import { handleApiError } from "@/lib/api-utils";

const IMPORT_SECRET = process.env.IMPORT_SECRET;

export async function POST(request: Request) {
  // Rate limiting is now handled globally by middleware (Upstash Redis)
  // Simple admin secret protection
  const authHeader = request.headers.get("authorization");
  if (!IMPORT_SECRET || authHeader !== `Bearer ${IMPORT_SECRET}`) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const { races } = body;

  if (!Array.isArray(races) || races.length === 0) {
    return Response.json({ error: "Le champ 'races' doit être un tableau non vide" }, { status: 400 });
  }

  // Validate and format each race
  const formatted = races.map((r: any) => ({
    name: r.name?.trim() || "Course sans nom",
    date: r.date, // YYYY-MM-DD
    location: r.location?.trim() || "",
    description: r.description?.trim() || "",
    federation: r.federation || "FFC",
    category: r.category || "Seniors",
    gender: r.gender || "H",
    distance_km: r.distance_km || null,
    elevation_gain: r.elevation_gain || null,
    rdi_score: r.rdi_score || null,
    is_official: r.is_official !== undefined ? r.is_official : true,
    department: r.department || null,
    region: r.region || null,
    gpx_data: r.gpx_data || null,
    weather_cache: null,
    source_url: r.source_url || null,
    status: r.status || "upcoming",
    creator_id: null, // Official races have no creator
  }));

  const { data, error } = await supabaseAdmin
    .from("races")
    .upsert(formatted, { onConflict: "name,date" })
    .select("id, name, date");

  if (error) return handleApiError(error, "RACES_IMPORT");

  return Response.json({
    imported: data?.length || 0,
    races: data,
  });
}
