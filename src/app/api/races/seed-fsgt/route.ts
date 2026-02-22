import { supabaseAdmin } from "@/lib/supabase";
import { handleApiError } from "@/lib/api-utils";

/**
 * POST /api/races/seed-fsgt
 *
 * Seeds the database with ~284 FSGT route races for the 2026 season across France.
 * Sources : cyclisme-amateur.com, cyclismerhonefsgt.fr, cyclismefsgt31.fr, fsgtcyclisme06.fr, fsgt71velo.fr
 * Protected by CRON_SECRET to prevent public access.
 * Idempotent: uses upsert on name+date to avoid duplicates.
 */

const CRON_SECRET = process.env.CRON_SECRET;

/* ═══ Mapping département → région ═══ */
const deptToRegion: Record<string, string> = {
  "14": "Normandie", "27": "Normandie", "50": "Normandie", "61": "Normandie", "76": "Normandie",
  "22": "Bretagne", "29": "Bretagne", "35": "Bretagne", "56": "Bretagne",
  "72": "Pays de la Loire", "44": "Pays de la Loire", "49": "Pays de la Loire", "53": "Pays de la Loire", "85": "Pays de la Loire",
  "78": "Île-de-France", "91": "Île-de-France", "92": "Île-de-France", "93": "Île-de-France", "94": "Île-de-France", "95": "Île-de-France", "77": "Île-de-France", "75": "Île-de-France",
  "62": "Hauts-de-France", "59": "Hauts-de-France", "02": "Hauts-de-France", "60": "Hauts-de-France", "80": "Hauts-de-France",
  "28": "Centre-Val de Loire", "36": "Centre-Val de Loire", "37": "Centre-Val de Loire", "41": "Centre-Val de Loire", "45": "Centre-Val de Loire", "18": "Centre-Val de Loire",
  "38": "Auvergne-Rhône-Alpes", "01": "Auvergne-Rhône-Alpes", "69": "Auvergne-Rhône-Alpes", "42": "Auvergne-Rhône-Alpes", "73": "Auvergne-Rhône-Alpes", "74": "Auvergne-Rhône-Alpes", "03": "Auvergne-Rhône-Alpes", "15": "Auvergne-Rhône-Alpes", "43": "Auvergne-Rhône-Alpes", "63": "Auvergne-Rhône-Alpes", "07": "Auvergne-Rhône-Alpes", "26": "Auvergne-Rhône-Alpes",
  "71": "Bourgogne-Franche-Comté", "21": "Bourgogne-Franche-Comté", "25": "Bourgogne-Franche-Comté", "39": "Bourgogne-Franche-Comté", "58": "Bourgogne-Franche-Comté", "70": "Bourgogne-Franche-Comté", "89": "Bourgogne-Franche-Comté", "90": "Bourgogne-Franche-Comté",
  "06": "Provence-Alpes-Côte d'Azur", "13": "Provence-Alpes-Côte d'Azur", "83": "Provence-Alpes-Côte d'Azur", "84": "Provence-Alpes-Côte d'Azur", "04": "Provence-Alpes-Côte d'Azur", "05": "Provence-Alpes-Côte d'Azur",
  "31": "Occitanie", "09": "Occitanie", "11": "Occitanie", "12": "Occitanie", "30": "Occitanie", "32": "Occitanie", "34": "Occitanie", "46": "Occitanie", "48": "Occitanie", "65": "Occitanie", "66": "Occitanie", "81": "Occitanie", "82": "Occitanie",
};

/* ═══ Nettoyer un nom de course scrapé ═══ */
function cleanName(raw: string): string {
  // Retirer les parenthèses incomplètes et le point final
  let name = raw
    .replace(/\s*\.\s*$/, "")
    .replace(/\s*\(\s*[^)]*$/, "") // parenthèse ouvrante non fermée
    .replace(/\s+/g, " ")
    .trim();

  // Capitaliser proprement chaque mot
  name = name
    .split(" ")
    .map((w) => {
      if (w.length <= 2 && w !== "Le" && w !== "La") return w.toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");

  return name;
}

/* ═══ Données FSGT route scrapées de cyclisme-amateur.com (22 fév → 28 juin 2026) ═══ */
const FSGT_RACES = [
  // Mars 2026
  { name: "Lamballe Armor (Planguenoual)", date: "2026-03-01", dept: "22", url: "https://www.cyclisme-amateur.com/course-228719-lamballe-armor-planguenoual-fsgt.html" },
  { name: "Montainville", date: "2026-03-01", dept: "78", url: "https://www.cyclisme-amateur.com/course-228009-montainville-fsgt.html" },
  { name: "Lavardin", date: "2026-03-07", dept: "72", url: "https://www.cyclisme-amateur.com/course-227486-lavardin-fsgt.html" },
  { name: "Maule", date: "2026-03-07", dept: "78", url: "https://www.cyclisme-amateur.com/course-228013-maule-fsgt.html" },
  { name: "Grainville/Odon", date: "2026-03-08", dept: "14", url: "https://www.cyclisme-amateur.com/course-228396-grainville-odon-fsgt.html" },
  { name: "Plouvien", date: "2026-03-08", dept: "29", url: "https://www.cyclisme-amateur.com/course-227922-plouvien-fsgt.html" },
  { name: "Villejust (Poste EDF)", date: "2026-03-08", dept: "91", url: "https://www.cyclisme-amateur.com/course-227999-villejust-poste-edf-fsgt.html" },
  { name: "Parigné-le-Pôlin", date: "2026-03-14", dept: "72", url: "https://www.cyclisme-amateur.com/course-227491-parigne-le-polin-fsgt.html" },
  { name: "Brest (Kirclos)", date: "2026-03-15", dept: "29", url: "https://www.cyclisme-amateur.com/course-227927-brest-kirclos-fsgt.html" },
  { name: "Champmotteux (Le Château Gaillard)", date: "2026-03-15", dept: "91", url: "https://www.cyclisme-amateur.com/course-228017-champmotteux-le-chateau-gaillard-fsgt.html" },
  { name: "Mouen", date: "2026-03-21", dept: "14", url: "https://www.cyclisme-amateur.com/course-228401-mouen-fsgt.html" },
  { name: "Saint-Corneille", date: "2026-03-21", dept: "72", url: "https://www.cyclisme-amateur.com/course-227498-saint-corneille-fsgt.html" },
  { name: "Villebon-sur-Yvette (ZI Courtaboeuf)", date: "2026-03-22", dept: "91", url: "https://www.cyclisme-amateur.com/course-228027-villebon-yvette-zi-courtaboeuf-fsgt.html" },
  { name: "René", date: "2026-03-28", dept: "72", url: "https://www.cyclisme-amateur.com/course-227503-rene-fsgt.html" },
  { name: "Bavent", date: "2026-03-29", dept: "14", url: "https://www.cyclisme-amateur.com/course-228406-bavent-fsgt.html" },
  { name: "Boinville-le-Gaillard", date: "2026-03-29", dept: "78", url: "https://www.cyclisme-amateur.com/course-228032-boinville-le-gaillard-fsgt.html" },

  // Avril 2026
  { name: "Précigné", date: "2026-04-04", dept: "72", url: "https://www.cyclisme-amateur.com/course-227508-precigne-fsgt.html" },
  { name: "Mégrit", date: "2026-04-05", dept: "22", url: "https://www.cyclisme-amateur.com/course-228724-megrit-fsgt.html" },
  { name: "Saint-Nicolas-de-la-Taille", date: "2026-04-05", dept: "76", url: "https://www.cyclisme-amateur.com/course-228639-saint-nicolas-de-la-taille-fsgt.html" },
  { name: "Saint-Sulpice-de-Favières", date: "2026-04-05", dept: "91", url: "https://www.cyclisme-amateur.com/course-228037-saint-sulpice-de-favieres-fsgt.html" },
  { name: "Ploudalmézeau", date: "2026-04-06", dept: "29", url: "https://www.cyclisme-amateur.com/course-227932-ploudalmezeau-fsgt.html" },
  { name: "Vieux-Pont", date: "2026-04-06", dept: "61", url: "https://www.cyclisme-amateur.com/course-228420-vieux-pont-fsgt.html" },
  { name: "Thoiry", date: "2026-04-06", dept: "78", url: "https://www.cyclisme-amateur.com/course-228042-thoiry-fsgt.html" },
  { name: "Terrehault", date: "2026-04-11", dept: "72", url: "https://www.cyclisme-amateur.com/course-227513-terrehault-fsgt.html" },
  { name: "Saint-Martin-des-Entrées", date: "2026-04-12", dept: "14", url: "https://www.cyclisme-amateur.com/course-228411-saint-martin-des-entrees-fsgt.html" },
  { name: "Saint-Renan", date: "2026-04-12", dept: "29", url: "https://www.cyclisme-amateur.com/course-227937-saint-renan-fsgt.html" },
  { name: "Bréauté", date: "2026-04-12", dept: "76", url: "https://www.cyclisme-amateur.com/course-228644-breaute-fsgt.html" },
  { name: "Trappes (Zone Industrielle)", date: "2026-04-12", dept: "78", url: "https://www.cyclisme-amateur.com/course-228047-trappes-zone-industrielle-fsgt.html" },
  { name: "Roëzé-sur-Sarthe", date: "2026-04-18", dept: "72", url: "https://www.cyclisme-amateur.com/course-227518-roeze-sarthe-fsgt.html" },
  { name: "La Cambe", date: "2026-04-19", dept: "14", url: "https://www.cyclisme-amateur.com/course-228416-la-cambe-fsgt.html" },
  { name: "Maule (Côte de la Rolanderie)", date: "2026-04-19", dept: "78", url: "https://www.cyclisme-amateur.com/course-228052-maule-cote-de-la-rolanderie-fsgt.html" },
  { name: "Duneau", date: "2026-04-25", dept: "72", url: "https://www.cyclisme-amateur.com/course-227523-duneau-fsgt.html" },
  { name: "Mespuits", date: "2026-04-25", dept: "91", url: "https://www.cyclisme-amateur.com/course-228057-mespuits-fsgt.html" },
  { name: "Congerville-Thionville (CLM)", date: "2026-04-26", dept: "91", url: "https://www.cyclisme-amateur.com/course-228062-congierville-thionville-fsgt.html" },
  { name: "Congerville-Thionville", date: "2026-04-26", dept: "91", url: "https://www.cyclisme-amateur.com/course-228067-congerville-thionville-fsgt.html" },
  { name: "Tour de l'Étampois Sud Essonne", date: "2026-04-26", dept: "91", url: "https://www.cyclisme-amateur.com/course-228072-tour-etampes-sud-essonne-fsgt.html" },
  { name: "Guillerval", date: "2026-04-26", dept: "91", url: "https://www.cyclisme-amateur.com/course-228077-guillerval-fsgt.html" },

  // Mai 2026
  { name: "Andrieu", date: "2026-05-01", dept: "14", url: "https://www.cyclisme-amateur.com/course-228421-andrieu-fsgt.html" },
  { name: "Gouesnou", date: "2026-05-01", dept: "29", url: "https://www.cyclisme-amateur.com/course-227942-gouesnou-fsgt.html" },
  { name: "Hautot-le-Vatois", date: "2026-05-01", dept: "76", url: "https://www.cyclisme-amateur.com/course-228649-hautot-le-vatois-fsgt.html" },
  { name: "Saint-Jean-du-Bois", date: "2026-05-02", dept: "72", url: "https://www.cyclisme-amateur.com/course-227528-saint-jean-du-bois-fsgt.html" },
  { name: "Brouy", date: "2026-05-03", dept: "91", url: "https://www.cyclisme-amateur.com/course-228082-brouy-fsgt.html" },
  { name: "Gorron", date: "2026-05-08", dept: "53", url: "https://www.cyclisme-amateur.com/course-227947-gorron-fsgt.html" },
  { name: "Écouché-les-Vallées", date: "2026-05-08", dept: "61", url: "https://www.cyclisme-amateur.com/course-228425-ecouche-les-vallees-fsgt.html" },
  { name: "Turretot", date: "2026-05-08", dept: "76", url: "https://www.cyclisme-amateur.com/course-228654-turretot-fsgt.html" },
  { name: "Égly", date: "2026-05-08", dept: "91", url: "https://www.cyclisme-amateur.com/course-228087-egly-fsgt.html" },
  { name: "Saint-Aubin-des-Coudrais", date: "2026-05-09", dept: "72", url: "https://www.cyclisme-amateur.com/course-227533-saint-aubin-des-coudrais-fsgt.html" },
  { name: "Nointot", date: "2026-05-10", dept: "76", url: "https://www.cyclisme-amateur.com/course-228659-nointot-fsgt.html" },
  { name: "Le Plessis-Pâté (ZI des Bordes)", date: "2026-05-10", dept: "91", url: "https://www.cyclisme-amateur.com/course-228092-le-plessis-pate-zi-des-bordes-fsgt.html" },
  { name: "Millières", date: "2026-05-14", dept: "50", url: "https://www.cyclisme-amateur.com/course-228430-millieres-fsgt.html" },
  { name: "Louailles", date: "2026-05-14", dept: "72", url: "https://www.cyclisme-amateur.com/course-227538-louailles-fsgt.html" },
  { name: "Thue-et-Mue (Cheux)", date: "2026-05-17", dept: "14", url: "https://www.cyclisme-amateur.com/course-228435-thue-et-mue-cheux-fsgt.html" },
  { name: "Val-au-Perche (Le Theil)", date: "2026-05-17", dept: "61", url: "https://www.cyclisme-amateur.com/course-228440-val-au-perche-le-theil-fsgt.html" },
  { name: "Vénestanville", date: "2026-05-17", dept: "76", url: "https://www.cyclisme-amateur.com/course-228664-venestanville-fsgt.html" },
  { name: "Tour Vallée de Seine 2026", date: "2026-05-17", dept: "76", url: "https://www.cyclisme-amateur.com/course-228669-tour-vallee-de-seine-2026-fsgt.html" },
  { name: "Ballon-Saint-Mars", date: "2026-05-23", dept: "72", url: "https://www.cyclisme-amateur.com/course-227543-ballon-saint-mars-fsgt.html" },
  { name: "Saint-Paul-du-Vernay", date: "2026-05-24", dept: "14", url: "https://www.cyclisme-amateur.com/course-228445-saint-paul-du-vernay-fsgt.html" },
  { name: "Saint-Germain-d'Étable", date: "2026-05-24", dept: "76", url: "https://www.cyclisme-amateur.com/course-228674-saint-germain-detable-fsgt.html" },
  { name: "Sées", date: "2026-05-25", dept: "61", url: "https://www.cyclisme-amateur.com/course-228450-sees-fsgt.html" },
  { name: "Varneville-Bretteville", date: "2026-05-30", dept: "76", url: "https://www.cyclisme-amateur.com/course-228679-varneville-bretteville-fsgt.html" },
  { name: "Pacy-sur-Eure (Pacy Tour)", date: "2026-05-31", dept: "27", url: "https://www.cyclisme-amateur.com/course-228455-pacy-eure-pacy-tour-fsgt.html" },
  { name: "Le Mêle-sur-Sarthe", date: "2026-05-31", dept: "61", url: "https://www.cyclisme-amateur.com/course-228460-le-mele-sarthe-fsgt.html" },
  { name: "Wissous", date: "2026-05-31", dept: "91", url: "https://www.cyclisme-amateur.com/course-228097-wissous-fsgt.html" },

  // Juin 2026
  { name: "Villejust", date: "2026-06-03", dept: "91", url: "https://www.cyclisme-amateur.com/course-228102-villejust-fsgt.html" },
  { name: "Rouperroux-le-Coquet", date: "2026-06-06", dept: "72", url: "https://www.cyclisme-amateur.com/course-227548-rouperroux-le-coquet-fsgt.html" },
  { name: "Cesny-les-Sources (Bois Halbout)", date: "2026-06-07", dept: "14", url: "https://www.cyclisme-amateur.com/course-228465-cesny-les-sources-bois-halbout-fsgt.html" },
  { name: "Fains", date: "2026-06-07", dept: "27", url: "https://www.cyclisme-amateur.com/course-228470-fains-fsgt.html" },
  { name: "Lannilis", date: "2026-06-07", dept: "29", url: "https://www.cyclisme-amateur.com/course-227952-lannilis-fsgt.html" },
  { name: "Marolles-les-Braults", date: "2026-06-13", dept: "72", url: "https://www.cyclisme-amateur.com/course-227553-marolles-les-braults-fsgt.html" },
  { name: "Croix-Mare", date: "2026-06-14", dept: "76", url: "https://www.cyclisme-amateur.com/course-228684-croix-mare-fsgt.html" },
  { name: "Boinville-en-Mantois", date: "2026-06-14", dept: "78", url: "https://www.cyclisme-amateur.com/course-228107-boinville-en-mantois-fsgt.html" },
  { name: "Thoiry", date: "2026-06-17", dept: "78", url: "https://www.cyclisme-amateur.com/course-228112-thoiry-fsgt.html" },
  { name: "Connerré", date: "2026-06-19", dept: "72", url: "https://www.cyclisme-amateur.com/course-227558-connerre-fsgt.html" },
  { name: "Port-Jérôme-sur-Seine", date: "2026-06-19", dept: "76", url: "https://www.cyclisme-amateur.com/course-228689-port-jerome-sur-seine-fsgt.html" },
  { name: "Béthon", date: "2026-06-20", dept: "72", url: "https://www.cyclisme-amateur.com/course-227563-bethon-fsgt.html" },
  { name: "Aigleville", date: "2026-06-21", dept: "27", url: "https://www.cyclisme-amateur.com/course-228475-aigleville-fsgt.html" },
  { name: "Sarceaux", date: "2026-06-21", dept: "61", url: "https://www.cyclisme-amateur.com/course-228480-sarceaux-fsgt.html" },
  { name: "Montfort-le-Gesnois", date: "2026-06-21", dept: "72", url: "https://www.cyclisme-amateur.com/course-227568-montfort-le-gesnois-fsgt.html" },
  { name: "Saint-Calais", date: "2026-06-21", dept: "72", url: "https://www.cyclisme-amateur.com/course-227573-saint-calais-fsgt.html" },
  { name: "Bolbec (Cyclo-sportive)", date: "2026-06-21", dept: "76", url: "https://www.cyclisme-amateur.com/course-228694-bolbec-cyclo-sportive-fsgt.html" },
  { name: "Bièvres - Vélizy-Villacoublay", date: "2026-06-21", dept: "91", url: "https://www.cyclisme-amateur.com/course-228117-bievres-velizy-villacoublay-fsgt.html" },
  { name: "Guibeville", date: "2026-06-24", dept: "91", url: "https://www.cyclisme-amateur.com/course-228122-guibeville-fsgt.html" },
  { name: "Buc", date: "2026-06-25", dept: "78", url: "https://www.cyclisme-amateur.com/course-228127-buc-fsgt.html" },
  { name: "Plabennec", date: "2026-06-26", dept: "29", url: "https://www.cyclisme-amateur.com/course-227957-plabennec-fsgt.html" },
  { name: "Criquetot-l'Esneval", date: "2026-06-26", dept: "76", url: "https://www.cyclisme-amateur.com/course-228699-criquetot-lesneval-fsgt.html" },
  { name: "Saint-Escobille", date: "2026-06-27", dept: "91", url: "https://www.cyclisme-amateur.com/course-228132-saint-escobille-fsgt.html" },
  { name: "Souleuvre-en-Bocage (La Graverie)", date: "2026-06-28", dept: "14", url: "https://www.cyclisme-amateur.com/course-228485-souleuvre-en-bocage-la-graverie-fsgt.html" },
  { name: "La Bazoge", date: "2026-06-28", dept: "72", url: "https://www.cyclisme-amateur.com/course-227578-la-bazoge-fsgt.html" },
  { name: "Criquetot-sur-Longueville", date: "2026-06-28", dept: "76", url: "https://www.cyclisme-amateur.com/course-228704-criquetot-sur-longueville-fsgt.html" },
  { name: "Corbreuse (CLM)", date: "2026-06-28", dept: "91", url: "https://www.cyclisme-amateur.com/course-228137-corbreuse-clm-fsgt.html" },
  { name: "Les 2 Jours de Saint-Escobille", date: "2026-06-28", dept: "91", url: "https://www.cyclisme-amateur.com/course-228142-les-2-jours-de-saint-escobille-fsgt.html" },
  { name: "Corbreuse", date: "2026-06-28", dept: "91", url: "https://www.cyclisme-amateur.com/course-228162-corbreuse-fsgt.html" },

  // Juillet 2026
  { name: "Maule", date: "2026-07-01", dept: "78", url: "https://www.cyclisme-amateur.com/course-228168-maule-fsgt.html" },
  { name: "Thue-et-Mue (Le Mesnil-Patry)", date: "2026-07-05", dept: "14", url: "https://www.cyclisme-amateur.com/course-228497-thue-et-mue-le-mesnil-patry-fsgt.html" },
  { name: "Trappes (Zone Industrielle)", date: "2026-07-05", dept: "78", url: "https://www.cyclisme-amateur.com/course-232612-trappes-zone-industrielle-fsgt.html" },
  { name: "Anet", date: "2026-07-10", dept: "28", url: "https://www.cyclisme-amateur.com/course-228172-anet-fsgt.html" },
  { name: "Saint-Aignan", date: "2026-07-11", dept: "72", url: "https://www.cyclisme-amateur.com/course-227619-saint-aignan-fsgt.html" },
  { name: "Saint-Jacques-sur-Darnétal", date: "2026-07-11", dept: "76", url: "https://www.cyclisme-amateur.com/course-225686-saint-jacques-darnetal-fsgt.html" },
  { name: "Amfreville", date: "2026-07-12", dept: "14", url: "https://www.cyclisme-amateur.com/course-228503-amfreville-fsgt.html" },
  { name: "Isigny-sur-Mer (Neuilly-la-Forêt)", date: "2026-07-14", dept: "14", url: "https://www.cyclisme-amateur.com/course-228509-isigny-mer-neuilly-la-foret-fsgt.html" },
  { name: "Mézières-sous-Ponthouin", date: "2026-07-14", dept: "72", url: "https://www.cyclisme-amateur.com/course-227624-mezieres-ponthouin-fsgt.html" },
  { name: "Écorpain", date: "2026-07-18", dept: "72", url: "https://www.cyclisme-amateur.com/course-227629-ecorpain-fsgt.html" },
  { name: "Coulonces", date: "2026-07-19", dept: "14", url: "https://www.cyclisme-amateur.com/course-228515-coulonces-fsgt.html" },
  { name: "Le Neubourg", date: "2026-07-19", dept: "27", url: "https://www.cyclisme-amateur.com/course-231374-le-neubourg-fsgt.html" },
  { name: "Neufchâtel-en-Bray", date: "2026-07-19", dept: "76", url: "https://www.cyclisme-amateur.com/course-225696-neufchatel-en-bray-fsgt.html" },
  { name: "Lieu-Saint-Amand (CLM)", date: "2026-07-26", dept: "59", url: "https://www.cyclisme-amateur.com/course-225700-lieu-saint-amand-fsgt.html" },

  // Août 2026
  { name: "Cossé-en-Champagne", date: "2026-08-01", dept: "53", url: "https://www.cyclisme-amateur.com/course-227634-cosse-en-champagne-fsgt.html" },
  { name: "Saint-Romain-de-Colbosc", date: "2026-08-01", dept: "76", url: "https://www.cyclisme-amateur.com/course-225706-saint-romain-de-colbosc-fsgt.html" },
  { name: "Mortrée", date: "2026-08-09", dept: "61", url: "https://www.cyclisme-amateur.com/course-228521-mortree-fsgt.html" },
  { name: "Grand-Couronne", date: "2026-08-09", dept: "76", url: "https://www.cyclisme-amateur.com/course-225712-grand-couronne-fsgt.html" },
  { name: "Bièvres", date: "2026-08-09", dept: "91", url: "https://www.cyclisme-amateur.com/course-228183-bievres-fsgt.html" },
  { name: "Biville-la-Baignarde", date: "2026-08-15", dept: "76", url: "https://www.cyclisme-amateur.com/course-225718-biville-la-baignarde-fsgt.html" },
  { name: "Le Fidélaire", date: "2026-08-22", dept: "27", url: "https://www.cyclisme-amateur.com/course-231378-le-fidelaire-fsgt.html" },
  { name: "Gouffern-en-Auge (FEL)", date: "2026-08-23", dept: "61", url: "https://www.cyclisme-amateur.com/course-228527-gouffern-en-auge-fel-fsgt.html" },
  { name: "Gouffern-en-Auge (FEL) — Course 2", date: "2026-08-23", dept: "61", url: "https://www.cyclisme-amateur.com/course-228529-gouffern-en-auge-fel-fsgt.html" },
  { name: "Allonnes", date: "2026-08-23", dept: "72", url: "https://www.cyclisme-amateur.com/course-227640-allonnes-fsgt.html" },
  { name: "Theuville-aux-Maillots", date: "2026-08-23", dept: "76", url: "https://www.cyclisme-amateur.com/course-225724-theuville-aux-maillot-fsgt.html" },
  { name: "Argentan", date: "2026-08-28", dept: "61", url: "https://www.cyclisme-amateur.com/course-228533-argentan-fsgt.html" },
  { name: "Tourouvre-au-Perche", date: "2026-08-29", dept: "61", url: "https://www.cyclisme-amateur.com/course-228535-tourouvre-au-perche-fsgt.html" },
  { name: "Champcueil", date: "2026-08-29", dept: "91", url: "https://www.cyclisme-amateur.com/course-228188-champcueil-fsgt.html" },

  // Septembre 2026
  { name: "Ceton", date: "2026-09-05", dept: "61", url: "https://www.cyclisme-amateur.com/course-228541-ceton-fsgt.html" },
  { name: "Beaumont-sur-Sarthe", date: "2026-09-05", dept: "72", url: "https://www.cyclisme-amateur.com/course-227647-beaumont-sur-sarthe-fsgt.html" },
  { name: "Doudeville", date: "2026-09-05", dept: "76", url: "https://www.cyclisme-amateur.com/course-225735-doudeville-fsgt.html" },
  { name: "Gruchet-le-Valasse", date: "2026-09-06", dept: "76", url: "https://www.cyclisme-amateur.com/course-225740-gruchet-le-valasse-fsgt.html" },
  { name: "Thue-et-Mue (Bretteville)", date: "2026-09-06", dept: "14", url: "https://www.cyclisme-amateur.com/course-228547-thue-et-mue-bretteville-fsgt.html" },
  { name: "Bouillon", date: "2026-09-06", dept: "72", url: "https://www.cyclisme-amateur.com/course-227652-bouillon-fsgt.html" },
  { name: "Auffay", date: "2026-09-06", dept: "76", url: "https://www.cyclisme-amateur.com/course-225745-auffay-fsgt.html" },
  { name: "Bazoches-sur-Hoëne", date: "2026-09-12", dept: "61", url: "https://www.cyclisme-amateur.com/course-228556-bazoches-sur-hoene-fsgt.html" },
  { name: "Marolles-lès-Saint-Calais (CLM)", date: "2026-09-12", dept: "72", url: "https://www.cyclisme-amateur.com/course-227657-marolles-les-saint-calais-fsgt.html" },
  { name: "Saint-Mars-d'Outillé", date: "2026-09-12", dept: "72", url: "https://www.cyclisme-amateur.com/course-227662-saint-mars-d-outille-fsgt.html" },
  { name: "Feuguerolles-Bully", date: "2026-09-13", dept: "14", url: "https://www.cyclisme-amateur.com/course-228570-feuguerolles-bully-fsgt.html" },
  { name: "Angerville-l'Orcher", date: "2026-09-13", dept: "76", url: "https://www.cyclisme-amateur.com/course-225759-angerville-l-orcher-fsgt.html" },
  { name: "Réau", date: "2026-09-13", dept: "77", url: "https://www.cyclisme-amateur.com/course-228198-reau-fsgt.html" },
  { name: "Souligné-Flacé", date: "2026-09-19", dept: "72", url: "https://www.cyclisme-amateur.com/course-227668-souligne-flace-fsgt.html" },
  { name: "Terre-de-Caux (CLM)", date: "2026-09-20", dept: "76", url: "https://www.cyclisme-amateur.com/course-225775-terre-de-caux-fsgt.html" },
  { name: "Esteville", date: "2026-09-27", dept: "76", url: "https://www.cyclisme-amateur.com/course-225779-esteville-fsgt.html" },

  // Octobre 2026
  { name: "Caen (Chemin Vert) — Gentleman", date: "2026-10-04", dept: "14", url: "https://www.cyclisme-amateur.com/course-228576-caen-chemin-vert-fsgt.html" },
  { name: "Semur-en-Vallon", date: "2026-10-04", dept: "72", url: "https://www.cyclisme-amateur.com/course-227673-semur-en-vallon-fsgt.html" },
  { name: "Croix-Mare (CLM)", date: "2026-10-04", dept: "76", url: "https://www.cyclisme-amateur.com/course-225784-croix-mare-fsgt.html" },
  { name: "Cabourg", date: "2026-10-11", dept: "14", url: "https://www.cyclisme-amateur.com/course-228592-cabourg-fsgt.html" },
  { name: "Arnage (Cyclo-sportive)", date: "2026-10-17", dept: "72", url: "https://www.cyclisme-amateur.com/course-227679-arnage-fsgt.html" },
  { name: "Saint-Georges-sur-Èvre — Gentleman", date: "2026-10-17", dept: "72", url: "https://www.cyclisme-amateur.com/course-227680-saint-georges-evre-fsgt.html" },
  { name: "Saint-Nicolas-de-la-Taille", date: "2026-10-18", dept: "76", url: "https://www.cyclisme-amateur.com/course-228624-saint-nicolas-de-la-taille-fsgt.html" },

  // Novembre 2026
  { name: "Caen", date: "2026-11-01", dept: "14", url: "https://www.cyclisme-amateur.com/course-228597-caen-fsgt.html" },

  // ═══════════════════════════════════════════════════════════════
  // FSGT RHÔNE / AUVERGNE-RHÔNE-ALPES (source: cyclismerhonefsgt.fr)
  // ═══════════════════════════════════════════════════════════════

  // Mars 2026
  { name: "G.P.O. Vénissieux", date: "2026-03-01", dept: "69", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "Prix de Rance", date: "2026-03-07", dept: "01", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "Prix de Meillonnas", date: "2026-03-29", dept: "01", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },

  // Avril 2026
  { name: "11ème Prix de Dommartin", date: "2026-04-11", dept: "01", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "Grand Prix du GEIQ — Saint-Priest", date: "2026-04-19", dept: "69", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "2ème Prix Team 6 — Crachier", date: "2026-04-25", dept: "38", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },

  // Mai 2026
  { name: "Prix de Vénissieux", date: "2026-05-01", dept: "69", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "Prix de Saint-Étienne-du-Bois", date: "2026-05-03", dept: "01", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "La Monsourdie — Monsols", date: "2026-05-09", dept: "69", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "Championnat Départemental Route FSGT 69", date: "2026-05-17", dept: "69", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "Grand Prix de Meyzieu", date: "2026-05-24", dept: "69", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "3ème Critérium de Saint-Maurice-l'Exil", date: "2026-05-31", dept: "38", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },

  // Juin 2026
  { name: "Prix de Simandre-sur-Suran", date: "2026-06-07", dept: "01", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "Championnat Régional Route AURA — Bussières", date: "2026-06-14", dept: "42", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "Prix d'Izernore", date: "2026-06-20", dept: "01", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },

  // Juillet 2026
  { name: "GP des Filatures — Saint-Vincent-de-Reins", date: "2026-07-05", dept: "69", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "Grimpée CLM du Colombier", date: "2026-07-05", dept: "01", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "Critérium de Bourg-en-Bresse", date: "2026-07-12", dept: "01", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "39ème Course Cycliste d'Hauterive", date: "2026-07-19", dept: "01", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },

  // Août 2026
  { name: "Prix de Tullins", date: "2026-08-29", dept: "38", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "Grimpée CLM La Verticale du Thou", date: "2026-08-30", dept: "69", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },

  // Septembre 2026
  { name: "27ème Boucle Châtenaisienne — Châtenay", date: "2026-09-05", dept: "01", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "28ème Grimpée CLM de Chaussan", date: "2026-09-05", dept: "69", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "Chronos de Corbas", date: "2026-09-06", dept: "69", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "Grand Prix de Vénissieux Parilly", date: "2026-09-12", dept: "69", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "Grand Prix R+R — Saint-Vulbas", date: "2026-09-20", dept: "01", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },

  // Octobre 2026
  { name: "CLM & Gentleman du Poulet — Vésines", date: "2026-10-11", dept: "01", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "CLM & Gentleman St André d'Huriat", date: "2026-10-18", dept: "01", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },
  { name: "8ème Gentleman de Culoz", date: "2026-10-25", dept: "01", url: "https://www.cyclismerhonefsgt.fr/calendrier/" },

  // ═══════════════════════════════════════════════════════════════
  // FSGT OCCITANIE-PYRÉNÉES (source: cyclismefsgt31.fr — PDF 15/01/2026)
  // ═══════════════════════════════════════════════════════════════

  // Mars 2026
  { name: "Tautavel", date: "2026-03-01", dept: "66", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Montoussin", date: "2026-03-07", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Merles", date: "2026-03-08", dept: "82", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Launac", date: "2026-03-29", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },

  // Avril 2026
  { name: "Fabas", date: "2026-04-06", dept: "09", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Longages", date: "2026-04-11", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Cap Découverte", date: "2026-04-12", dept: "81", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Castelsagrat", date: "2026-04-19", dept: "82", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Muret", date: "2026-04-26", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },

  // Mai 2026
  { name: "Balma", date: "2026-05-01", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Aussonne", date: "2026-05-03", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Tour du Tarn Montagne Noire — Étape 1", date: "2026-05-09", dept: "81", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Tour du Tarn Montagne Noire — Étapes 2-3", date: "2026-05-10", dept: "81", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Montauban Le Ramier", date: "2026-05-14", dept: "82", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Championnat Inter-Départemental — Bazus", date: "2026-05-17", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Tour du Fousseret — Étape 1", date: "2026-05-23", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Tour du Fousseret — Étapes 2-3", date: "2026-05-24", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Albi Le Séquestre — Nocturne", date: "2026-05-27", dept: "81", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Championnat Régional Occitanie — Saint-Agnan", date: "2026-05-31", dept: "81", url: "https://cyclismefsgt31.fr/route/calendrier-route" },

  // Juin 2026
  { name: "Castelsarrasin", date: "2026-06-07", dept: "82", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Caujac", date: "2026-06-14", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Candie 1/2/3", date: "2026-06-17", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Noueilles", date: "2026-06-21", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Candie 4/5 & Dames", date: "2026-06-24", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Poucharramet", date: "2026-06-26", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },

  // Juillet 2026
  { name: "Albi Le Séquestre — Nocturne", date: "2026-07-01", dept: "81", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Candie 1/2/3", date: "2026-07-08", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Candie 4/5 & Dames", date: "2026-07-15", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Candie 1/2/3", date: "2026-07-22", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Rieumes — Nocturne", date: "2026-07-25", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Candie 4/5 & Dames", date: "2026-07-29", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },

  // Août 2026
  { name: "Aurignac", date: "2026-08-01", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Candie 1/2/3", date: "2026-08-05", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Candie 4/5 & Dames", date: "2026-08-12", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Longages", date: "2026-08-15", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Candie 1/2/3", date: "2026-08-19", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Castres — Après-midi", date: "2026-08-23", dept: "81", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Candie 4/5 & Dames", date: "2026-08-26", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Balma", date: "2026-08-30", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },

  // Septembre 2026
  { name: "Rieumes — Après-midi", date: "2026-09-05", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Roquettes", date: "2026-09-06", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Pins-Justaret", date: "2026-09-13", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Montespan", date: "2026-09-19", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Paulhac", date: "2026-09-20", dept: "31", url: "https://cyclismefsgt31.fr/route/calendrier-route" },
  { name: "Fabas", date: "2026-09-27", dept: "09", url: "https://cyclismefsgt31.fr/route/calendrier-route" },

  // ═══════════════════════════════════════════════════════════════
  // FSGT PACA — ALPES-MARITIMES & VAR (source: fsgtcyclisme06.fr)
  // ═══════════════════════════════════════════════════════════════

  // Février 2026
  { name: "7ème Gentleman de Carros", date: "2026-02-01", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "GP de Valréas", date: "2026-02-22", dept: "84", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },

  // Mars 2026
  { name: "GP Méjannes-lès-Alès", date: "2026-03-08", dept: "30", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "GP Ouverture — Nice", date: "2026-03-22", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "CLM du Grand Duc", date: "2026-03-29", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },

  // Avril 2026
  { name: "Ronde de Plascassier", date: "2026-04-06", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "GP de Carnas", date: "2026-04-12", dept: "30", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "GP de Cannes la Bocca", date: "2026-04-19", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "GP de Dommessargues", date: "2026-04-26", dept: "30", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },

  // Mai 2026
  { name: "Grand Prix d'Andon — Inter-Région J1", date: "2026-05-01", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "CLM de la Ville de Nice — Inter-Région J2", date: "2026-05-02", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "GP du Broc — Inter-Région J3", date: "2026-05-03", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "Nice — Saorge", date: "2026-05-14", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "29ème Tour des Villages Azuréens — Étape 1", date: "2026-05-23", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "29ème Tour des Villages Azuréens — Étape 2", date: "2026-05-24", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "29ème Tour des Villages Azuréens — Étape 3 CLM", date: "2026-05-24", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "29ème Tour des Villages Azuréens — Étape 4", date: "2026-05-25", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "GP du Circuit du Var", date: "2026-05-30", dept: "83", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "CLM Contes — Coaraze", date: "2026-05-31", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },

  // Juin 2026
  { name: "GranFondo La Drapoise", date: "2026-06-07", dept: "83", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "GP d'Ascros", date: "2026-06-14", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "Menton — Col de la Madone", date: "2026-06-21", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "GP Auron", date: "2026-06-28", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },

  // Juillet 2026
  { name: "GP de Boujan", date: "2026-07-14", dept: "34", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },

  // Août 2026
  { name: "GranFondo Les Cimes du Mercantour", date: "2026-08-02", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "Grimpée de Fontfroide", date: "2026-08-15", dept: "34", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "GP de Gréolières", date: "2026-08-16", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "Col du Layrac", date: "2026-08-22", dept: "34", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "GP des Verriers", date: "2026-08-23", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "GP de Vence", date: "2026-08-30", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },

  // Septembre 2026
  { name: "Nice — Auron", date: "2026-09-06", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "Trophée des Champions", date: "2026-09-20", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },
  { name: "GP Ceramica — Challenge Métiers d'Arts", date: "2026-09-27", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },

  // Octobre 2026
  { name: "CLM de Gourdon", date: "2026-10-04", dept: "06", url: "https://www.fsgtcyclisme06.fr/fsgt/calendar/2026/" },

  // ═══════════════════════════════════════════════════════════════
  // FSGT BOURGOGNE-FRANCHE-COMTÉ — SAÔNE-ET-LOIRE (source: fsgt71velo.fr)
  // ═══════════════════════════════════════════════════════════════

  // Février 2026
  { name: "Prix d'Ecuelles", date: "2026-02-28", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },

  // Mars 2026
  { name: "Prix de Verzé", date: "2026-03-07", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "Prix de Vivans", date: "2026-03-08", dept: "42", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "Prix de Jully-les-Buxy", date: "2026-03-14", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "Prix de St-Martin-en-Gatinois", date: "2026-03-21", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "Prix de Varennes-St-Sauveur", date: "2026-03-28", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },

  // Avril 2026
  { name: "44ème Prix des Artisans — St-Martin-en-Bresse", date: "2026-04-05", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "Prix de Chatenoy-en-Bresse", date: "2026-04-11", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "Prix de Saint-Eusèbe", date: "2026-04-19", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "2ème Prix des Bizots", date: "2026-04-26", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },

  // Mai 2026
  { name: "Prix des Artisans de Verdun", date: "2026-05-01", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "Prix de Granges", date: "2026-05-03", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "18ème Prix de Génelard", date: "2026-05-08", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "18ème Prix de la Ville du Breuil", date: "2026-05-14", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "Prix de Baudrières", date: "2026-05-16", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "Championnat Départemental Route FSGT 71 — Senecy-le-Grand", date: "2026-05-24", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },

  // Juin 2026
  { name: "CLM de Toutenant", date: "2026-06-13", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "Grand Prix de Louhans", date: "2026-06-21", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "Tour de Luzy — Prologue + Étape 1", date: "2026-06-27", dept: "58", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "Tour de Luzy — Étape 2 + CLM", date: "2026-06-28", dept: "58", url: "https://www.fsgt71velo.fr/calendrier/" },

  // Juillet 2026
  { name: "Championnat National Route FSGT — Selongey Prologue", date: "2026-07-03", dept: "21", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "Championnat National Route FSGT — Selongey J1", date: "2026-07-04", dept: "21", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "Championnat National Route FSGT — Selongey J2", date: "2026-07-05", dept: "21", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "Prix de Chambilly", date: "2026-07-10", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },

  // Août 2026
  { name: "CLM de Bruailles", date: "2026-08-15", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },

  // Septembre 2026
  { name: "Gentleman de Nanton — CLM", date: "2026-09-05", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "CLM Ouroux-sur-Saône", date: "2026-09-13", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "CLM Saint-Pierre-de-Varennes", date: "2026-09-20", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "Championnat Départemental CLM x4 FSGT 71", date: "2026-09-27", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },

  // Octobre 2026
  { name: "Gentleman Fargeot — CLM", date: "2026-10-03", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },
  { name: "CLM Cave de Buxy", date: "2026-10-10", dept: "71", url: "https://www.fsgt71velo.fr/calendrier/" },
];

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let inserted = 0;
    let skipped = 0;

    for (const race of FSGT_RACES) {
      const region = deptToRegion[race.dept] || "Autre";
      const location = cleanName(race.name);

      const { error } = await supabaseAdmin.from("races").upsert(
        {
          name: `FSGT — ${race.name}`,
          date: race.date,
          location: location,
          department: race.dept,
          region: region,
          federation: "FSGT" as const,
          category: "Seniors",
          gender: "MIXTE" as const,
          status: "upcoming",
          is_official: true,
          source_url: race.url,
          description: `Course FSGT route — ${race.name}. Source : ${new URL(race.url).hostname.replace("www.", "")}`,
        },
        { onConflict: "name,date" }
      );

      if (!error) {
        inserted++;
      } else {
        skipped++;
      }
    }

    return Response.json({
      success: true,
      total: FSGT_RACES.length,
      inserted,
      skipped,
      message: `${inserted} courses FSGT route importées (${skipped} ignorées/doublons)`,
    });
  } catch (err) {
    return handleApiError(err, "RACES_SEED_FSGT");
  }
}
