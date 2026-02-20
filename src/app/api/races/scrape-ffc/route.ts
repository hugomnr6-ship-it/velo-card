import { supabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/api-utils";

export const maxDuration = 60;

const DEPT_TO_REGION: Record<string, string> = {
  "Ain":"Auvergne-Rhône-Alpes","Aisne":"Hauts-de-France","Allier":"Auvergne-Rhône-Alpes",
  "Alpes-de-Haute-Provence":"Provence-Alpes-Côte d'Azur","Hautes-Alpes":"Provence-Alpes-Côte d'Azur",
  "Alpes-Maritimes":"Provence-Alpes-Côte d'Azur","Ardèche":"Auvergne-Rhône-Alpes",
  "Ardennes":"Grand Est","Ariège":"Occitanie","Aube":"Grand Est","Aude":"Occitanie",
  "Aveyron":"Occitanie","Bouches-du-Rhône":"Provence-Alpes-Côte d'Azur","Calvados":"Normandie",
  "Cantal":"Auvergne-Rhône-Alpes","Charente":"Nouvelle-Aquitaine","Charente-Maritime":"Nouvelle-Aquitaine",
  "Cher":"Centre-Val de Loire","Corrèze":"Nouvelle-Aquitaine","Corse-du-Sud":"Corse",
  "Haute-Corse":"Corse","Côte-d'Or":"Bourgogne-Franche-Comté","Côtes-d'Armor":"Bretagne",
  "Creuse":"Nouvelle-Aquitaine","Dordogne":"Nouvelle-Aquitaine","Doubs":"Bourgogne-Franche-Comté",
  "Drôme":"Auvergne-Rhône-Alpes","Eure":"Normandie","Eure-et-Loir":"Centre-Val de Loire",
  "Finistère":"Bretagne","Gard":"Occitanie","Haute-Garonne":"Occitanie","Gers":"Occitanie",
  "Gironde":"Nouvelle-Aquitaine","Hérault":"Occitanie","Ille-et-Vilaine":"Bretagne",
  "Indre":"Centre-Val de Loire","Indre-et-Loire":"Centre-Val de Loire","Isère":"Auvergne-Rhône-Alpes",
  "Jura":"Bourgogne-Franche-Comté","Landes":"Nouvelle-Aquitaine","Loir-et-Cher":"Centre-Val de Loire",
  "Loire":"Auvergne-Rhône-Alpes","Haute-Loire":"Auvergne-Rhône-Alpes","Loire-Atlantique":"Pays de la Loire",
  "Loiret":"Centre-Val de Loire","Lot":"Occitanie","Lot-et-Garonne":"Nouvelle-Aquitaine",
  "Lozère":"Occitanie","Maine-et-Loire":"Pays de la Loire","Manche":"Normandie",
  "Marne":"Grand Est","Haute-Marne":"Grand Est","Mayenne":"Pays de la Loire",
  "Meurthe-et-Moselle":"Grand Est","Meuse":"Grand Est","Morbihan":"Bretagne",
  "Moselle":"Grand Est","Nièvre":"Bourgogne-Franche-Comté","Nord":"Hauts-de-France",
  "Oise":"Hauts-de-France","Orne":"Normandie","Pas-de-Calais":"Hauts-de-France",
  "Puy-de-Dôme":"Auvergne-Rhône-Alpes","Pyrénées-Atlantiques":"Nouvelle-Aquitaine",
  "Hautes-Pyrénées":"Occitanie","Pyrénées-Orientales":"Occitanie","Bas-Rhin":"Grand Est",
  "Haut-Rhin":"Grand Est","Rhône":"Auvergne-Rhône-Alpes","Haute-Saône":"Bourgogne-Franche-Comté",
  "Saône-et-Loire":"Bourgogne-Franche-Comté","Sarthe":"Pays de la Loire","Savoie":"Auvergne-Rhône-Alpes",
  "Haute-Savoie":"Auvergne-Rhône-Alpes","Paris":"Île-de-France","Seine-Maritime":"Normandie",
  "Seine-et-Marne":"Île-de-France","Yvelines":"Île-de-France","Deux-Sèvres":"Nouvelle-Aquitaine",
  "Somme":"Hauts-de-France","Tarn":"Occitanie","Tarn-et-Garonne":"Occitanie",
  "Var":"Provence-Alpes-Côte d'Azur","Vaucluse":"Provence-Alpes-Côte d'Azur",
  "Vendée":"Pays de la Loire","Vienne":"Nouvelle-Aquitaine","Haute-Vienne":"Nouvelle-Aquitaine",
  "Vosges":"Grand Est","Yonne":"Bourgogne-Franche-Comté","Territoire de Belfort":"Bourgogne-Franche-Comté",
  "Essonne":"Île-de-France","Hauts-de-Seine":"Île-de-France","Seine-Saint-Denis":"Île-de-France",
  "Val-de-Marne":"Île-de-France","Val-d'Oise":"Île-de-France",
  "Guadeloupe":"Outre-mer","Martinique":"Outre-mer","Guyane":"Outre-mer",
  "La Réunion":"Outre-mer","Mayotte":"Outre-mer","Nouvelle-Calédonie":"Outre-mer",
};

function parseDate(dateStr: string): string | null {
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

function extractCategories(name: string): string | null {
  const n = name.toUpperCase();
  const cats = new Set<string>();

  if (/[ÉE]LITE|ÉLITE/.test(n)) cats.add("Élite");
  if (/OPEN\s*1|\bOP\s*1\b/.test(n)) cats.add("Open 1");
  if (/OPEN\s*2|\bOP\s*2\b/.test(n)) cats.add("Open 2");
  if (/OPEN\s*3|\bOP\s*3\b/.test(n)) cats.add("Open 3");
  if (/\bOPEN\b/.test(n) && !/OPEN\s*[123]/.test(n)) {
    cats.add("Open 1"); cats.add("Open 2"); cats.add("Open 3");
  }
  if (/\bA\s*1\b|ACC[EÈ]S\s*1|ACCESS\s*1/.test(n)) cats.add("Access 1");
  if (/\bA\s*2\b|ACC[EÈ]S\s*2|ACCESS\s*2/.test(n)) cats.add("Access 2");
  if (/\bA\s*3\b|ACC[EÈ]S\s*3|ACCESS\s*3/.test(n)) cats.add("Access 3");
  if (/\bA\s*4\b|ACC[EÈ]S\s*4|ACCESS\s*4/.test(n)) cats.add("Access 4");
  if (/\bACC[EÈ]S\b|\bACCESS\b/.test(n) && !/ACC[EÈ]S\s*[1-4]|ACCESS\s*[1-4]/.test(n)) {
    cats.add("Access 1"); cats.add("Access 2"); cats.add("Access 3"); cats.add("Access 4");
  }
  const rm = n.match(/\bA\s*([1-4])\s*[-/]\s*A?\s*([1-4])\b/);
  if (rm) { for (let i = parseInt(rm[1]); i <= parseInt(rm[2]); i++) cats.add(`Access ${i}`); }
  if (/JUNIOR|JUN\b|U\s*19/.test(n)) cats.add("Junior");
  if (/CADET|CAD\b|U\s*17/.test(n)) cats.add("Cadet");
  if (/MINIM|U\s*15/.test(n)) cats.add("Minime");
  if (/U\s*13|PUPILLE|POUSSIN/.test(n)) cats.add("U13");
  if (/\bEDV\b|ECOLE DE V|ÉCOLE DE V/.test(n)) cats.add("EDV");
  if (/\b-?\s*EC\s*$/.test(n)) cats.add("EDV");

  return cats.size > 0 ? [...cats].join(",") : null;
}

// Regex-based HTML parser (no JSDOM needed)
function parseFFCHtml(html: string) {
  const races: { name: string; date: string; location: string; type: string }[] = [];

  // Split by organisation blocks
  const orgRegex = /<div[^>]*class="[^"]*organisation(?:\s[^"]*)?(?:"[^>]*)?>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi;
  const blocks = html.match(orgRegex) || [];

  // Fallback: extract from organisation-titre classes directly
  if (blocks.length === 0) {
    // Find all libelle entries (race names) and nearby fields
    const nameRegex = /organisation-titre-libelle[^>]*>([^<]+)</g;
    const dateRegex = /organisation-titre-jours[^>]*>([^<]+)</g;
    const locRegex = /organisation-titre-localisation[^>]*>([^<]+)</g;
    const typeRegex = /organisation-titre-calendrierType[^>]*>([^<]+)</g;

    const names: string[] = [];
    const dates: string[] = [];
    const locs: string[] = [];
    const types: string[] = [];

    let m;
    while ((m = nameRegex.exec(html)) !== null) names.push(m[1].trim());
    while ((m = dateRegex.exec(html)) !== null) dates.push(m[1].trim());
    while ((m = locRegex.exec(html)) !== null) locs.push(m[1].trim());
    while ((m = typeRegex.exec(html)) !== null) types.push(m[1].trim());

    // Check for ANNULÉ near each entry
    const annuleRegex = /badge-annule|ANNULÉ|ANNULE/gi;

    for (let i = 0; i < names.length; i++) {
      races.push({
        name: names[i] || "",
        date: dates[i] || "",
        location: locs[i] || "",
        type: types[i] || "",
      });
    }
  }

  return races;
}

// Filter out cancelled races
function filterCancelled(html: string, races: { name: string; date: string; location: string; type: string }[]) {
  // Find names of cancelled races
  const cancelledNames = new Set<string>();
  const cancelRegex = /ANNUL[ÉE][\s\S]{0,500}?organisation-titre-libelle[^>]*>([^<]+)/gi;
  let m;
  while ((m = cancelRegex.exec(html)) !== null) {
    cancelledNames.add(m[1].trim());
  }
  // Also check reverse: name then ANNULÉ
  const cancelRegex2 = /organisation-titre-libelle[^>]*>([^<]+)[\s\S]{0,200}?ANNUL[ÉE]/gi;
  while ((m = cancelRegex2.exec(html)) !== null) {
    cancelledNames.add(m[1].trim());
  }

  return races.filter(r => !cancelledNames.has(r.name));
}

const ALL_WINDOWS = [
  { debut: "21/02/2026", nbjours: 14 },
  { debut: "07/03/2026", nbjours: 14 },
  { debut: "21/03/2026", nbjours: 14 },
  { debut: "04/04/2026", nbjours: 14 },
  { debut: "18/04/2026", nbjours: 13 },
];

export async function POST(request: Request) {
  const userOrRes = await getAuthenticatedUser();
  if (userOrRes instanceof Response) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const windowIdx = body.window;

  const windowsToScrape = windowIdx !== undefined
    ? [ALL_WINDOWS[windowIdx]]
    : ALL_WINDOWS.slice(0, 1);

  const BASE = "https://competitions.ffc.fr/calendrier/calendrier.aspx";
  const allRaw: { name: string; date: string; location: string; type: string }[] = [];

  for (const w of windowsToScrape) {
    const url = `${BASE}?discipline=1&autourType=IP&nbjours=${w.nbjours}&debut=${encodeURIComponent(w.debut)}`;
    const resp = await fetch(url);
    const html = await resp.text();
    const parsed = parseFFCHtml(html);
    const filtered = filterCancelled(html, parsed);
    allRaw.push(...filtered);
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = allRaw.filter((r) => {
    const key = `${r.name}|${r.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Format
  const formatted = unique.map((r) => {
    let category = extractCategories(r.name);
    if (!category) {
      if (r.type === "International") category = "Élite,Open 1";
      else if (r.type === "National") category = "Élite,Open 1,Open 2,Open 3";
      else category = "Open 1,Open 2,Open 3";
    }
    return {
      name: r.name, date: parseDate(r.date), location: r.location,
      description: "", department: r.location,
      region: DEPT_TO_REGION[r.location] || null,
      federation: "FFC", category, gender: "MIXTE",
      is_official: true, status: "upcoming",
      source_url: "https://competitions.ffc.fr/calendrier/",
      distance_km: null, elevation_gain: null, rdi_score: null,
      gpx_data: null, weather_cache: null, creator_id: null,
    };
  });

  // Upsert in batches
  let imported = 0;
  const errors: string[] = [];
  for (let i = 0; i < formatted.length; i += 100) {
    const batch = formatted.slice(i, i + 100);
    const { data, error } = await supabaseAdmin
      .from("races")
      .upsert(batch, { onConflict: "name,date" })
      .select("id");
    if (error) errors.push(`Batch ${i}: ${error.message}`);
    else imported += data?.length || 0;
  }

  return Response.json({
    window: windowIdx ?? 0,
    scraped: allRaw.length,
    unique: unique.length,
    imported,
    errors,
  });
}
