import { supabaseAdmin } from "@/lib/supabase";
import { handleApiError } from "@/lib/api-utils";

const IMPORT_SECRET = process.env.IMPORT_SECRET;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!IMPORT_SECRET || authHeader !== `Bearer ${IMPORT_SECRET}`) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const { updates } = body; // Array of { id, category }

  if (!Array.isArray(updates) || updates.length === 0) {
    return Response.json({ error: "Le champ 'updates' doit être un tableau non vide" }, { status: 400 });
  }

  let updated = 0;
  const errors: string[] = [];

  // Batch update in chunks of 50
  for (let i = 0; i < updates.length; i += 50) {
    const chunk = updates.slice(i, i + 50);
    for (const u of chunk) {
      const { error } = await supabaseAdmin
        .from("races")
        .update({ category: u.category })
        .eq("id", u.id);
      if (error) {
        errors.push(`${u.id}: ${error.message}`);
      } else {
        updated++;
      }
    }
  }

  return Response.json({ updated, errors: errors.length, errorDetails: errors.slice(0, 5) });
}
