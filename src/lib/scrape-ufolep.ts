/**
 * Utilitaire de scraping du calendrier UFOLEP depuis ufolep-cyclisme.org
 *
 * Ce module fournit les outils pour :
 * 1. Construire les URLs du calendrier UFOLEP par département
 * 2. Parser les données HTML en objets de courses
 * 3. Mapper les départements aux régions françaises
 *
 * Utilisé par l'API /api/admin/scrape-ufolep qui effectue le scraping
 * côté serveur, ou par un script navigateur via l'extension Chrome.
 *
 * Le site ufolep-cyclisme.org utilise l'URL suivante pour le calendrier :
 * https://www.ufolep-cyclisme.org/Site_Activites_Cyclistes
 * Avec des paramètres pour filtrer par département, mois, année, type d'épreuve.
 */

import { getRegionFromDept } from "@/data/ufolep-races-2026";

// Liste des 101 départements français (métropole + outre-mer cycliste)
export const FRENCH_DEPARTMENTS = [
  "01", "02", "03", "04", "05", "06", "07", "08", "09",
  "10", "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "21", "22", "23", "24", "25", "26", "27", "28", "29",
  "30", "31", "32", "33", "34", "35", "36", "37", "38", "39",
  "40", "41", "42", "43", "44", "45", "46", "47", "48", "49",
  "50", "51", "52", "53", "54", "55", "56", "57", "58", "59",
  "60", "61", "62", "63", "64", "65", "66", "67", "68",
  "69", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79",
  "80", "81", "82", "83", "84", "85", "86", "87", "88", "89",
  "90", "91", "92", "93", "94", "95",
  "2A", "2B",
];

// Mois de la saison 2026 (mars à octobre pour route)
export const SEASON_MONTHS_2026 = [
  "2026-01", "2026-02", "2026-03", "2026-04", "2026-05",
  "2026-06", "2026-07", "2026-08", "2026-09", "2026-10",
];

/**
 * URL de base du calendrier national UFOLEP
 */
export const UFOLEP_CALENDAR_BASE_URL = "https://www.ufolep-cyclisme.org/Site_Activites_Cyclistes";

/**
 * Construit l'URL du calendrier UFOLEP pour un département et un mois donnés.
 * Le site utilise un formulaire POST ou des paramètres de query string
 * pour filtrer les résultats.
 */
export function buildCalendarUrl(department: string, year: number = 2026): string {
  // L'URL exacte du calendrier UFOLEP peut nécessiter des ajustements
  // en fonction de la structure du site au moment du scraping
  return `${UFOLEP_CALENDAR_BASE_URL}?dept=${department}&year=${year}&type=cyclosport`;
}

/**
 * Interface d'une course scrapée (brute, avant nettoyage)
 */
export interface ScrapedRace {
  name: string;
  date: string; // YYYY-MM-DD
  location: string;
  department: string;
  region: string | null;
  category: string;
  distance_km: number | null;
  source_url: string | null;
  organizer: string | null;
}

/**
 * Parse une ligne HTML du calendrier UFOLEP.
 * Cette fonction doit être adaptée à la structure HTML réelle du site.
 *
 * @example
 * // Format typique d'une ligne du calendrier :
 * // <tr>
 * //   <td>07/03/2026</td>
 * //   <td>Course d'Orgères-en-Beauce</td>
 * //   <td>Orgères-en-Beauce</td>
 * //   <td>28</td>
 * //   <td>AC Voves</td>
 * // </tr>
 */
export function parseRaceRow(row: {
  date?: string;
  name?: string;
  location?: string;
  department?: string;
  organizer?: string;
  distance?: string;
}): ScrapedRace | null {
  if (!row.date || !row.name || !row.location) return null;

  // Convertit DD/MM/YYYY → YYYY-MM-DD
  const dateParts = row.date.split("/");
  let isoDate: string;

  if (dateParts.length === 3) {
    const [day, month, year] = dateParts;
    isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  } else {
    // Déjà au format ISO ?
    isoDate = row.date;
  }

  // Valide le format de date
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;

  const dept = row.department?.trim() || "";
  const region = getRegionFromDept(dept);

  return {
    name: row.name.trim(),
    date: isoDate,
    location: row.location.trim(),
    department: dept,
    region,
    category: "Toutes catégories",
    distance_km: row.distance ? parseFloat(row.distance) || null : null,
    source_url: null,
    organizer: row.organizer?.trim() || null,
  };
}

/**
 * Déduplique les courses par (name, date).
 * Garde la version la plus complète (avec le plus de champs remplis).
 */
export function deduplicateRaces(races: ScrapedRace[]): ScrapedRace[] {
  const map = new Map<string, ScrapedRace>();

  for (const race of races) {
    const key = `${race.name}|${race.date}`;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, race);
      continue;
    }

    // Garde la version avec le plus de champs remplis
    const existingScore = countFilledFields(existing);
    const newScore = countFilledFields(race);

    if (newScore > existingScore) {
      map.set(key, race);
    }
  }

  return Array.from(map.values());
}

function countFilledFields(race: ScrapedRace): number {
  let count = 0;
  if (race.name) count++;
  if (race.location) count++;
  if (race.department) count++;
  if (race.region) count++;
  if (race.distance_km) count++;
  if (race.source_url) count++;
  if (race.organizer) count++;
  return count;
}

/**
 * Script JavaScript à exécuter dans le navigateur (via l'extension Chrome)
 * pour extraire les courses du calendrier UFOLEP.
 *
 * Ce script est conçu pour être injecté via mcp__Claude_in_Chrome__javascript_tool.
 */
export const BROWSER_SCRAPE_SCRIPT = `
(function() {
  // Sélectionne toutes les lignes du tableau de courses
  const rows = document.querySelectorAll('table.calendar tr, table tr, .liste-epreuves tr');
  const races = [];

  for (const row of rows) {
    const cells = row.querySelectorAll('td');
    if (cells.length < 3) continue;

    // Essaie différentes structures de tableau
    const race = {
      date: cells[0]?.textContent?.trim() || '',
      name: cells[1]?.textContent?.trim() || '',
      location: cells[2]?.textContent?.trim() || '',
      department: cells[3]?.textContent?.trim() || '',
      organizer: cells[4]?.textContent?.trim() || '',
      distance: cells[5]?.textContent?.trim() || '',
    };

    // Filtre les lignes d'en-tête
    if (race.date && /\\d{2}\\/\\d{2}\\/\\d{4}/.test(race.date)) {
      races.push(race);
    }
  }

  return JSON.stringify(races);
})();
`;
