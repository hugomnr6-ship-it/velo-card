import { getAuthenticatedUser, isErrorResponse, handleApiError, isValidUUID } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

// GET — Fetch all engagés for a race
export async function GET(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  const { raceId } = await params;
  if (!isValidUUID(raceId)) {
    return Response.json({ error: "ID invalide" }, { status: 400 });
  }

  const { data: engages, error } = await supabaseAdmin
    .from("race_engages")
    .select("id, rider_name, user_id, bib_number, club, category")
    .eq("race_id", raceId)
    .order("bib_number", { ascending: true, nullsFirst: false });

  if (error) return handleApiError(error, "ENGAGES_GET");

  return Response.json(engages || []);
}

// POST — Import startlist (from OCR or manual)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;
  const { profileId } = auth;

  const { raceId } = await params;
  if (!isValidUUID(raceId)) {
    return Response.json({ error: "ID invalide" }, { status: 400 });
  }

  // Verify race exists
  const { data: race } = await supabaseAdmin
    .from("races")
    .select("id")
    .eq("id", raceId)
    .single();

  if (!race) {
    return Response.json({ error: "Course introuvable" }, { status: 404 });
  }

  const body = await request.json();
  const { riders } = body;

  if (!Array.isArray(riders) || riders.length === 0) {
    return Response.json(
      { error: "Le champ 'riders' doit être un tableau non vide" },
      { status: 400 },
    );
  }

  // Fetch all profiles for name matching (case-insensitive)
  const { data: allProfiles } = await supabaseAdmin
    .from("profiles")
    .select("id, username");

  // Build a lookup: lowercase username → profile id
  const profileLookup: Record<string, string> = {};
  for (const p of allProfiles || []) {
    if (p.username) {
      profileLookup[p.username.toLowerCase()] = p.id;
    }
  }

  // Prepare rows with name matching
  let matchedCount = 0;
  const rows = riders.map((r: any) => {
    const name = String(r.rider_name || "").trim();
    const nameLower = name.toLowerCase();

    // Try exact match, then partial match
    let userId: string | null = profileLookup[nameLower] || null;

    // Also try reversed name (e.g., "DUPONT Jean" vs "Jean DUPONT")
    if (!userId) {
      const parts = nameLower.split(/\s+/);
      if (parts.length >= 2) {
        const reversed = [...parts.slice(1), parts[0]].join(" ");
        userId = profileLookup[reversed] || null;
      }
    }

    if (userId) matchedCount++;

    return {
      race_id: raceId,
      rider_name: name,
      user_id: userId,
      bib_number: r.bib_number ? Number(r.bib_number) : null,
      club: r.club ? String(r.club).trim() : null,
      category: r.category ? String(r.category).trim() : null,
      added_by: profileId,
    };
  });

  // Upsert (on conflict rider_name per race)
  const { data, error } = await supabaseAdmin
    .from("race_engages")
    .upsert(rows, { onConflict: "race_id,rider_name" })
    .select("id, rider_name, user_id");

  if (error) return handleApiError(error, "ENGAGES_POST");

  // Also auto-create race_entries for matched users (so they appear as participants)
  const matchedUserIds = rows
    .filter((r) => r.user_id)
    .map((r) => r.user_id as string);

  if (matchedUserIds.length > 0) {
    // Get existing entries to avoid duplicates
    const { data: existingEntries } = await supabaseAdmin
      .from("race_entries")
      .select("user_id")
      .eq("race_id", raceId)
      .in("user_id", matchedUserIds);

    const existingSet = new Set((existingEntries || []).map((e: any) => e.user_id));
    const newEntries = matchedUserIds
      .filter((uid) => !existingSet.has(uid))
      .map((uid) => ({ race_id: raceId, user_id: uid }));

    if (newEntries.length > 0) {
      await supabaseAdmin.from("race_entries").insert(newEntries);
    }
  }

  return Response.json({
    total: data?.length || 0,
    matched: matchedCount,
    ghosts: (data?.length || 0) - matchedCount,
  });
}

// DELETE — Clear all engagés for a race
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  const { raceId } = await params;
  if (!isValidUUID(raceId)) {
    return Response.json({ error: "ID invalide" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("race_engages")
    .delete()
    .eq("race_id", raceId);

  if (error) return handleApiError(error, "ENGAGES_DELETE");

  return Response.json({ success: true });
}
