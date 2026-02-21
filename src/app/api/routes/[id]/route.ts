import { NextResponse } from "next/server";
import { getAuthenticatedUser, handleApiError, isValidUUID } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/routes/[id] — Détail d'un parcours sauvegardé.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof Response) return authResult;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "ID invalide" } },
        { status: 400 },
      );
    }

    const { data: route, error } = await supabaseAdmin
      .from("saved_routes")
      .select("*")
      .eq("id", id)
      .eq("user_id", authResult.profileId)
      .single();

    if (error || !route) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Parcours introuvable" } },
        { status: 404 },
      );
    }

    return NextResponse.json(route);
  } catch (err) {
    return handleApiError(err, "ROUTES_GET");
  }
}

/**
 * DELETE /api/routes/[id] — Supprimer un parcours sauvegardé.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof Response) return authResult;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "ID invalide" } },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("saved_routes")
      .delete()
      .eq("id", id)
      .eq("user_id", authResult.profileId);

    if (error) throw error;

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err, "ROUTES_DELETE");
  }
}
