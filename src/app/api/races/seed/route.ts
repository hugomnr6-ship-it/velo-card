import { supabaseAdmin } from "@/lib/supabase";
import type { Federation } from "@/types";

/**
 * POST /api/races/seed
 *
 * Seeds the database with ~30 realistic races in Occitanie for the 2026 season.
 * Protected by CRON_SECRET to prevent public access.
 * Idempotent: uses upsert on name+date to avoid duplicates.
 */

const CRON_SECRET = process.env.CRON_SECRET;

interface SeedRace {
  name: string;
  date: string;
  location: string;
  department: string;
  region: string;
  federation: Federation;
  category: string;
  gender: "MIXTE" | "H" | "F";
  distance_km: number;
  elevation_gain: number;
  rdi_score: number;
  status: "upcoming";
  is_official: boolean;
  created_by: null;
}

const SEED_RACES: SeedRace[] = [
  // Mars 2026
  { name: "GP de Canohes", date: "2026-03-01", location: "Canohes", department: "66", region: "Occitanie", federation: "FFC", category: "DN3", gender: "H", distance_km: 75, elevation_gain: 980, rdi_score: 7.2, status: "upcoming", is_official: true, created_by: null },
  { name: "Ronde du Roussillon", date: "2026-03-08", location: "Perpignan", department: "66", region: "Occitanie", federation: "UFOLEP", category: "Toutes", gender: "MIXTE", distance_km: 62, elevation_gain: 450, rdi_score: 4.8, status: "upcoming", is_official: true, created_by: null },
  { name: "Circuit de Narbonne", date: "2026-03-15", location: "Narbonne", department: "11", region: "Occitanie", federation: "FFC", category: "DN2", gender: "H", distance_km: 88, elevation_gain: 1450, rdi_score: 8.1, status: "upcoming", is_official: true, created_by: null },
  { name: "Criterium de Beziers", date: "2026-03-16", location: "Beziers", department: "34", region: "Occitanie", federation: "FSGT", category: "Toutes", gender: "MIXTE", distance_km: 45, elevation_gain: 200, rdi_score: 3.2, status: "upcoming", is_official: true, created_by: null },
  { name: "GP du Minervois", date: "2026-03-22", location: "Olonzac", department: "34", region: "Occitanie", federation: "FFC", category: "DN3", gender: "H", distance_km: 82, elevation_gain: 1100, rdi_score: 7.5, status: "upcoming", is_official: true, created_by: null },
  { name: "Ronde de l'Aude", date: "2026-03-29", location: "Carcassonne", department: "11", region: "Occitanie", federation: "UFOLEP", category: "Toutes", gender: "MIXTE", distance_km: 70, elevation_gain: 850, rdi_score: 6.5, status: "upcoming", is_official: true, created_by: null },

  // Avril 2026
  { name: "Classic du Pic Saint-Loup", date: "2026-04-05", location: "Saint-Mathieu-de-Treviers", department: "34", region: "Occitanie", federation: "FFC", category: "DN2", gender: "H", distance_km: 105, elevation_gain: 2200, rdi_score: 9.0, status: "upcoming", is_official: true, created_by: null },
  { name: "Tour du Gard", date: "2026-04-06", location: "Nimes", department: "30", region: "Occitanie", federation: "UFOLEP", category: "Toutes", gender: "MIXTE", distance_km: 95, elevation_gain: 1300, rdi_score: 7.0, status: "upcoming", is_official: true, created_by: null },
  { name: "GP de Toulouse", date: "2026-04-12", location: "Toulouse", department: "31", region: "Occitanie", federation: "FFC", category: "DN1", gender: "H", distance_km: 120, elevation_gain: 1800, rdi_score: 8.5, status: "upcoming", is_official: true, created_by: null },
  { name: "Nocturne de Montpellier", date: "2026-04-15", location: "Montpellier", department: "34", region: "Occitanie", federation: "FSGT", category: "Toutes", gender: "MIXTE", distance_km: 40, elevation_gain: 100, rdi_score: 2.5, status: "upcoming", is_official: true, created_by: null },
  { name: "Boucle des Corbieres", date: "2026-04-19", location: "Lagrasse", department: "11", region: "Occitanie", federation: "FFC", category: "DN3", gender: "H", distance_km: 78, elevation_gain: 1200, rdi_score: 7.8, status: "upcoming", is_official: true, created_by: null },
  { name: "Ronde de l'Ariege", date: "2026-04-20", location: "Foix", department: "09", region: "Occitanie", federation: "UFOLEP", category: "Toutes", gender: "MIXTE", distance_km: 85, elevation_gain: 1800, rdi_score: 8.3, status: "upcoming", is_official: true, created_by: null },
  { name: "Circuit du Pont du Gard", date: "2026-04-26", location: "Remoulins", department: "30", region: "Occitanie", federation: "FFC", category: "DN3", gender: "H", distance_km: 68, elevation_gain: 600, rdi_score: 5.2, status: "upcoming", is_official: true, created_by: null },

  // Mai 2026
  { name: "Grimpee du Ventoux", date: "2026-05-03", location: "Bedoin", department: "34", region: "Occitanie", federation: "FFC", category: "DN1", gender: "H", distance_km: 55, elevation_gain: 2500, rdi_score: 9.5, status: "upcoming", is_official: true, created_by: null },
  { name: "GP de Lodeve", date: "2026-05-10", location: "Lodeve", department: "34", region: "Occitanie", federation: "UFOLEP", category: "Toutes", gender: "MIXTE", distance_km: 72, elevation_gain: 1100, rdi_score: 7.3, status: "upcoming", is_official: true, created_by: null },
  { name: "Tour du Larzac", date: "2026-05-11", location: "Millau", department: "12", region: "Occitanie", federation: "FFC", category: "DN2", gender: "H", distance_km: 110, elevation_gain: 2100, rdi_score: 8.8, status: "upcoming", is_official: true, created_by: null },
  { name: "Criterium de Sete", date: "2026-05-17", location: "Sete", department: "34", region: "Occitanie", federation: "FSGT", category: "Toutes", gender: "MIXTE", distance_km: 48, elevation_gain: 350, rdi_score: 4.0, status: "upcoming", is_official: true, created_by: null },
  { name: "GP des Cevennes", date: "2026-05-24", location: "Ales", department: "30", region: "Occitanie", federation: "FFC", category: "DN2", gender: "H", distance_km: 98, elevation_gain: 2000, rdi_score: 8.7, status: "upcoming", is_official: true, created_by: null },
  { name: "Boucle du Canigou", date: "2026-05-25", location: "Prades", department: "66", region: "Occitanie", federation: "UFOLEP", category: "Toutes", gender: "MIXTE", distance_km: 80, elevation_gain: 1600, rdi_score: 8.0, status: "upcoming", is_official: true, created_by: null },
  { name: "Ronde du Tarn", date: "2026-05-31", location: "Albi", department: "81", region: "Occitanie", federation: "FFC", category: "DN3", gender: "H", distance_km: 90, elevation_gain: 1050, rdi_score: 6.8, status: "upcoming", is_official: true, created_by: null },

  // Juin 2026
  { name: "GP du Haut-Languedoc", date: "2026-06-07", location: "Saint-Pons-de-Thomieres", department: "34", region: "Occitanie", federation: "FFC", category: "DN2", gender: "H", distance_km: 95, elevation_gain: 1900, rdi_score: 8.5, status: "upcoming", is_official: true, created_by: null },
  { name: "Tour de la Lozere", date: "2026-06-08", location: "Mende", department: "48", region: "Occitanie", federation: "UFOLEP", category: "Toutes", gender: "MIXTE", distance_km: 105, elevation_gain: 2300, rdi_score: 9.1, status: "upcoming", is_official: true, created_by: null },
  { name: "Nocturne de Perpignan", date: "2026-06-12", location: "Perpignan", department: "66", region: "Occitanie", federation: "FSGT", category: "Toutes", gender: "MIXTE", distance_km: 42, elevation_gain: 150, rdi_score: 2.8, status: "upcoming", is_official: true, created_by: null },
  { name: "Classic des Pyrenees", date: "2026-06-14", location: "Luchon", department: "31", region: "Occitanie", federation: "FFC", category: "DN1", gender: "H", distance_km: 130, elevation_gain: 3200, rdi_score: 9.8, status: "upcoming", is_official: true, created_by: null },
  { name: "Ronde de la Garrigue", date: "2026-06-21", location: "Uzes", department: "30", region: "Occitanie", federation: "UFOLEP", category: "Toutes", gender: "MIXTE", distance_km: 65, elevation_gain: 700, rdi_score: 5.8, status: "upcoming", is_official: true, created_by: null },
  { name: "GP du Lauragais", date: "2026-06-22", location: "Castelnaudary", department: "11", region: "Occitanie", federation: "FFC", category: "DN3", gender: "H", distance_km: 76, elevation_gain: 550, rdi_score: 4.5, status: "upcoming", is_official: true, created_by: null },
  { name: "Tour du Conflent", date: "2026-06-28", location: "Villefranche-de-Conflent", department: "66", region: "Occitanie", federation: "UFOLEP", category: "Toutes", gender: "MIXTE", distance_km: 88, elevation_gain: 1700, rdi_score: 8.2, status: "upcoming", is_official: true, created_by: null },
  { name: "GP de Carcassonne", date: "2026-06-29", location: "Carcassonne", department: "11", region: "Occitanie", federation: "FFC", category: "DN2", gender: "H", distance_km: 92, elevation_gain: 1300, rdi_score: 7.4, status: "upcoming", is_official: true, created_by: null },
  { name: "Criterium de Montauban", date: "2026-06-14", location: "Montauban", department: "82", region: "Occitanie", federation: "FSGT", category: "Toutes", gender: "MIXTE", distance_km: 50, elevation_gain: 280, rdi_score: 3.5, status: "upcoming", is_official: true, created_by: null },
  { name: "Tour des Causses", date: "2026-06-21", location: "Rodez", department: "12", region: "Occitanie", federation: "FFC", category: "DN3", gender: "H", distance_km: 100, elevation_gain: 1650, rdi_score: 7.9, status: "upcoming", is_official: true, created_by: null },
];

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let inserted = 0;

    for (const race of SEED_RACES) {
      const { error } = await supabaseAdmin.from("races").upsert(
        {
          name: race.name,
          date: race.date,
          location: race.location,
          department: race.department,
          region: race.region,
          federation: race.federation,
          category: race.category,
          gender: race.gender,
          distance_km: race.distance_km,
          elevation_gain: race.elevation_gain,
          rdi_score: race.rdi_score,
          status: race.status,
          is_official: race.is_official,
          created_by: race.created_by,
        },
        { onConflict: "name,date" }
      );

      if (!error) inserted++;
    }

    return Response.json({
      success: true,
      total: SEED_RACES.length,
      inserted,
      message: `${inserted} courses Occitanie seedees avec succes`,
    });
  } catch (err: any) {
    console.error("[SEED] Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
