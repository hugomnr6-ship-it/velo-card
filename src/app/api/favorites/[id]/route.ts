import { getAuthenticatedUser, isErrorResponse, handleApiError, isValidUUID } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * DELETE /api/favorites/[id] — Supprimer un favori.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  if (!isValidUUID(id)) {
    return Response.json({ error: "ID invalide" }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin
      .from("favorites")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.profileId);

    if (error) throw error;

    return Response.json({ deleted: true });
  } catch (err) {
    return handleApiError(err, "FAVORITES_DELETE");
  }
}
