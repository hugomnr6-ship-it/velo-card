import { supabaseAdmin } from "@/lib/supabase";
import {
  FRENCH_DEPARTMENTS,
  SEASON_MONTHS_2026,
  UFOLEP_CALENDAR_BASE_URL,
  type ScrapedRace,
  deduplicateRaces,
} from "@/lib/scrape-ufolep";
import { getRegionFromDept } from "@/data/ufolep-races-2026";

/**
 * POST /api/admin/scrape-ufolep
 *
 * Scrape le calendrier UFOLEP depuis ufolep-cyclisme.org
 * et insère les courses dans la base.
 *
 * Body optionnel :
 * - departments: string[] — liste des départements à scraper (défaut : tous)
 * - dry_run: boolean — si true, retourne les données sans insérer
 *
 * Protégé par le secret admin.
 */
export async function POST(request: Request) {
  // Vérification du secret admin
  const authHeader = request.headers.get("authorization");
  const adminSecret = process.env.ADMIN_SECRET;

  if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Secret admin invalide" } },
      { status: 401 }
    );
  }

  let departments = FRENCH_DEPARTMENTS;
  let dryRun = false;

  try {
    const body = await request.json();
    if (body?.departments?.length > 0) {
      departments = body.departments;
    }
    dryRun = body?.dry_run === true;
  } catch {
    // Pas de body → défauts
  }

  const allRaces: ScrapedRace[] = [];
  const errors: string[] = [];

  // Scrape chaque département
  for (const dept of departments) {
    try {
      const url = `${UFOLEP_CALENDAR_BASE_URL}?dept=${dept}&year=2026&type=cyclosport`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "VeloCard/1.0 (calendrier cycliste)",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(10000), // 10s timeout par département
      });

      if (!response.ok) {
        errors.push(`Dept ${dept}: HTTP ${response.status}`);
        continue;
      }

      const html = await response.text();
      const races = parseHtmlCalendar(html, dept);
      allRaces.push(...races);

      // Petit délai pour ne pas surcharger le serveur
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (err) {
      errors.push(`Dept ${dept}: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
    }
  }

  // Déduplique
  const uniqueRaces = deduplicateRaces(allRaces);

  if (dryRun) {
    return Response.json({
      message: "Dry run — aucune insertion effectuée",
      total_scraped: allRaces.length,
      after_dedup: uniqueRaces.length,
      departments_scraped: departments.length,
      errors: errors.length > 0 ? errors : undefined,
      races: uniqueRaces,
    });
  }

  // Insère dans la base
  let inserted = 0;
  const BATCH_SIZE = 50;

  for (let i = 0; i < uniqueRaces.length; i += BATCH_SIZE) {
    const batch = uniqueRaces.slice(i, i + BATCH_SIZE).map((race) => ({
      creator_id: null,
      name: race.name,
      date: race.date,
      location: race.location,
      description: `Épreuve cyclosport UFOLEP route — ${race.region || race.department}`,
      federation: "UFOLEP" as const,
      category: race.category,
      gender: "MIXTE" as const,
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

    const { data, error } = await supabaseAdmin
      .from("races")
      .upsert(batch as any, {
        onConflict: "name,date",
        ignoreDuplicates: true,
      })
      .select("id");

    if (error) {
      errors.push(`Insert batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
    } else {
      inserted += data?.length ?? 0;
    }
  }

  return Response.json({
    message: "Scraping UFOLEP terminé",
    total_scraped: allRaces.length,
    after_dedup: uniqueRaces.length,
    inserted,
    departments_scraped: departments.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

/**
 * Parse le HTML du calendrier UFOLEP pour extraire les courses.
 * Adapte le parsing à la structure HTML du site ufolep-cyclisme.org.
 */
function parseHtmlCalendar(html: string, department: string): ScrapedRace[] {
  const races: ScrapedRace[] = [];
  const region = getRegionFromDept(department);

  // Pattern 1 : Tableau HTML classique avec <tr>/<td>
  // Le site UFOLEP utilise généralement des tableaux avec les colonnes :
  // Date | Nom | Lieu | Département | Organisateur
  const tableRowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

  let rowMatch;
  while ((rowMatch = tableRowRegex.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    const cells: string[] = [];

    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      // Nettoie le HTML des cellules
      const text = cellMatch[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();
      cells.push(text);
    }

    if (cells.length < 3) continue;

    // Cherche une date au format DD/MM/YYYY ou DD-MM-YYYY
    const dateMatch = cells[0]?.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (!dateMatch) continue;

    const [, day, month, year] = dateMatch;
    const isoDate = `${year}-${month}-${day}`;

    // Vérifie que c'est bien 2026
    if (year !== "2026") continue;

    races.push({
      name: cells[1] || `Course UFOLEP ${cells[2] || department}`,
      date: isoDate,
      location: cells[2] || department,
      department,
      region,
      category: "Toutes catégories",
      distance_km: cells[5] ? parseFloat(cells[5]) || null : null,
      source_url: `${UFOLEP_CALENDAR_BASE_URL}?dept=${department}&year=2026`,
      organizer: cells[4] || null,
    });
  }

  // Pattern 2 : Divs/spans avec classes spécifiques (si pas de tableau)
  if (races.length === 0) {
    // Essaie un pattern plus générique avec des dates dans le HTML
    const datePattern = /(\d{2})[\/\-](\d{2})[\/\-](2026)/g;
    let dateMatch;

    while ((dateMatch = datePattern.exec(html)) !== null) {
      const [, day, month, year] = dateMatch;
      const isoDate = `${year}-${month}-${day}`;

      // Extrait le contexte autour de la date (200 caractères avant/après)
      const start = Math.max(0, dateMatch.index - 200);
      const end = Math.min(html.length, dateMatch.index + 200);
      const context = html.slice(start, end).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

      // Essaie d'extraire un nom de lieu ou d'épreuve du contexte
      const nameMatch = context.match(/(?:course|épreuve|prix|grand prix|championnat|critérium)\s+(?:de\s+)?([A-ZÀ-Ü][a-zà-ÿ-]+(?:\s+[A-ZÀ-Ü][a-zà-ÿ-]+)*)/i);
      const locationMatch = context.match(/(?:à|a)\s+([A-ZÀ-Ü][a-zà-ÿ-]+(?:\s+[A-ZÀ-Ü][a-zà-ÿ-]+)*)/i);

      if (nameMatch || locationMatch) {
        races.push({
          name: nameMatch?.[0] || `Course UFOLEP ${locationMatch?.[1] || department}`,
          date: isoDate,
          location: locationMatch?.[1] || department,
          department,
          region,
          category: "Toutes catégories",
          distance_km: null,
          source_url: `${UFOLEP_CALENDAR_BASE_URL}?dept=${department}&year=2026`,
          organizer: null,
        });
      }
    }
  }

  return races;
}
