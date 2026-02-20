import { supabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUser, isErrorResponse } from "@/lib/api-utils";

export async function POST(request: Request) {
  // Use session auth — only logged-in users can call this
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;

  const body = await request.json();
  const { updates } = body; // Array of { id, category }

  if (!Array.isArray(updates) || updates.length === 0) {
    return Response.json({ error: "Le champ 'updates' doit être un tableau non vide" }, { status: 400 });
  }

  let updated = 0;
  const errors: string[] = [];

  for (const u of updates) {
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

  return Response.json({ updated, errors: errors.length, errorDetails: errors.slice(0, 5) });
}
