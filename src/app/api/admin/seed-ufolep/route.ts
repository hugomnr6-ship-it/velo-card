import { supabaseAdmin } from "@/lib/supabase";
import { UFOLEP_RACES_2026 } from "@/data/ufolep-races-2026";

/**
 * POST /api/admin/seed-ufolep
 *
 * Importe toutes les courses UFOLEP 2026 dans la table `races`.
 * Utilise un upsert basé sur (name, date) pour éviter les doublons.
 *
 * Protégé par un secret admin dans le header Authorization.
 * En dev, le header est optionnel.
 */
export async function POST(request: Request) {
  // Vérification du secret admin (en prod)
  const authHeader = request.headers.get("authorization");
  const adminSecret = process.env.ADMIN_SECRET;

  if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Secret admin invalide" } },
      { status: 401 }
    );
  }

  // Parse les options du body (optionnel)
  let dryRun = false;
  try {
    const body = await request.json();
    dryRun = body?.dry_run === true;
  } catch {
    // Pas de body → pas de dry_run
  }

  // Prépare les rows pour l'insertion
  const rows = UFOLEP_RACES_2026.map((race) => ({
    creator_id: null, // Courses officielles, pas de créateur utilisateur
    name: race.name,
    date: race.date,
    location: race.location,
    description: race.description,
    federation: "UFOLEP" as const,
    category: race.category,
    gender: race.gender,
    distance_km: race.distance_km,
    elevation_gain: null,
    rdi_score: null,
    is_official: true,
    department: race.department,
    region: race.region,
    gpx_data: null,
    weather_cache: null,
    source_url: race.source_url,
    status: new Date(race.date) < new Date() ? "past" : "upcoming",
  }));

  if (dryRun) {
    return Response.json({
      message: "Dry run — aucune insertion effectuée",
      total_races: rows.length,
      races: rows.map((r) => ({ name: r.name, date: r.date, location: r.location, region: r.region })),
    });
  }

  // Upsert par batch de 50 pour éviter les timeouts
  const BATCH_SIZE = 50;
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabaseAdmin
      .from("races")
      .upsert(batch as any, {
        onConflict: "name,date",
        ignoreDuplicates: true,
      })
      .select("id");

    if (error) {
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
    } else {
      inserted += data?.length ?? 0;
    }
  }

  // Calcule les stats
  skipped = rows.length - inserted;

  return Response.json({
    message: `Seed UFOLEP terminé`,
    total_in_seed: rows.length,
    inserted,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}

/**
 * GET /api/admin/seed-ufolep
 *
 * Dry run — retourne les courses qui seraient importées sans les insérer.
 */
export async function GET() {
  const races = UFOLEP_RACES_2026.map((race) => ({
    name: race.name,
    date: race.date,
    location: race.location,
    department: race.department,
    region: race.region,
    distance_km: race.distance_km,
    source_url: race.source_url,
  }));

  // Compte combien existent déjà
  const { count } = await supabaseAdmin
    .from("races")
    .select("id", { count: "exact", head: true })
    .eq("federation", "UFOLEP");

  return Response.json({
    total_in_seed: races.length,
    existing_ufolep_in_db: count ?? 0,
    races,
  });
}
