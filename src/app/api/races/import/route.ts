import { supabaseAdmin } from "@/lib/supabase";
import { handleApiError } from "@/lib/api-utils";
import { getAuthenticatedUser, isErrorResponse } from "@/lib/api-utils";

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

// GET — Dedup mode: find and remove near-duplicate races
export async function GET(request: Request) {
  // Auth: session-based (any logged-in user can trigger for now)
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry") !== "false";

  // Fetch all races
  const { data: allRaces, error } = await supabaseAdmin
    .from("races")
    .select("id, name, date, department, location, category, region")
    .order("date", { ascending: true });

  if (error) return handleApiError(error, "DEDUP_FETCH");
  if (!allRaces || allRaces.length === 0) {
    return Response.json({ message: "Aucune course", duplicates: [] });
  }

  // Group by (date, department)
  const groups: Record<string, typeof allRaces> = {};
  for (const race of allRaces) {
    const key = `${race.date}|${race.department || race.location || "?"}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(race);
  }

  // Within each group, find near-duplicates
  const toDelete: { id: string; name: string; date: string; reason: string; kept: string }[] = [];

  for (const [key, races] of Object.entries(groups)) {
    if (races.length < 2) continue;

    // Compare all pairs
    for (let i = 0; i < races.length; i++) {
      for (let j = i + 1; j < races.length; j++) {
        const a = races[i];
        const b = races[j];

        const nameA = normalizeName(a.name);
        const nameB = normalizeName(b.name);

        // Skip if names are identical (already handled by upsert)
        if (nameA === nameB) continue;

        // Check if one name fully contains the other
        const aContainsB = nameA.includes(nameB);
        const bContainsA = nameB.includes(nameA);

        if (aContainsB || bContainsA) {
          const shorter = nameA.length <= nameB.length ? a : b;
          const longer = nameA.length <= nameB.length ? b : a;
          const shorterNorm = nameA.length <= nameB.length ? nameA : nameB;
          const longerNorm = nameA.length <= nameB.length ? nameB : nameA;

          // Get the extra part (what the longer name has that the shorter doesn't)
          const extra = longerNorm.replace(shorterNorm, "").trim();

          // Skip if the extra part contains a different category keyword
          // (e.g., "GP Milléco Elite" vs "GP Milléco Elite Open Access" → different races!)
          const catKeywords = ["u15", "u17", "u19", "cadet", "junior", "minime", "benjamin",
            "elite", "open", "access", "feminin", "feminine", "femme", "femmes", "dame", "dames",
            "homme", "hommes", "veteran", "master", "espoir"];
          const extraHasCat = catKeywords.some(kw => extra.includes(kw));

          // If the extra part contains a gender/category keyword, the longer name
          // is likely a different race variant (e.g., "Paris-Roubaix" vs "Paris-Roubaix Femmes")
          // → skip to avoid deleting a legitimate different race
          const genderKeywords = ["femme", "femmes", "feminine", "feminin", "dame", "dames",
            "homme", "hommes"];
          const extraHasGender = genderKeywords.some(kw => extra.includes(kw));
          if (extraHasGender) continue;

          const shorterHasCat = catKeywords.some(kw => shorterNorm.includes(kw));

          // If shorter name already has a category keyword AND extra text also has one,
          // they're likely different category races → skip
          if (shorterHasCat && extraHasCat) continue;

          // Merge categories: keep the richer category set
          const catA = a.category || "";
          const catB = b.category || "";
          const mergedCat = catA.length >= catB.length ? catA : catB;

          toDelete.push({
            id: shorter.id,
            name: shorter.name,
            date: shorter.date,
            reason: `contenu dans "${longer.name}"`,
            kept: longer.name,
          });

          // Update the kept race to have merged categories if needed
          if (mergedCat && mergedCat !== (longer === a ? catA : catB)) {
            if (!dryRun) {
              await supabaseAdmin
                .from("races")
                .update({ category: mergedCat })
                .eq("id", longer.id);
            }
          }
        }
      }
    }
  }

  // Deduplicate the deletion list (a race might match multiple others)
  const uniqueDeletes = [...new Map(toDelete.map(d => [d.id, d])).values()];

  // Actually delete if not dry run
  if (!dryRun && uniqueDeletes.length > 0) {
    const idsToDelete = uniqueDeletes.map(d => d.id);
    // Delete in batches of 50
    for (let i = 0; i < idsToDelete.length; i += 50) {
      const batch = idsToDelete.slice(i, i + 50);
      await supabaseAdmin
        .from("races")
        .delete()
        .in("id", batch);
    }
  }

  return Response.json({
    mode: dryRun ? "dry_run" : "executed",
    total_races: allRaces.length,
    duplicates_found: uniqueDeletes.length,
    remaining: allRaces.length - uniqueDeletes.length,
    duplicates: uniqueDeletes,
  });
}

// Normalize a race name for comparison
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // remove accents
    .replace(/[^a-z0-9\s]/g, " ")  // keep only alphanumeric
    .replace(/\s+/g, " ")
    .trim();
}

