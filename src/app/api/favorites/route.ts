import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

const addFavoriteSchema = z.object({
  entity_type: z.enum(["race", "route", "profile"]),
  entity_id: z.string().uuid("entity_id invalide"),
});

/**
 * GET /api/favorites — Liste les favoris de l'utilisateur.
 * Query: ?entity_type=race (optionnel, filtre par type)
 */
export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entity_type");

    let query = supabaseAdmin
      .from("favorites")
      .select("*")
      .eq("user_id", auth.profileId)
      .order("created_at", { ascending: false });

    if (entityType) {
      query = query.eq("entity_type", entityType);
    }

    const { data, error } = await query;
    if (error) throw error;

    return Response.json(data || []);
  } catch (err) {
    return handleApiError(err, "FAVORITES_GET");
  }
}

/**
 * POST /api/favorites — Ajouter un favori.
 * Body: { entity_type: "race" | "route" | "profile", entity_id: UUID }
 */
export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const validated = validateBody(addFavoriteSchema, body);
    if (validated instanceof Response) return validated;

    const { data, error } = await supabaseAdmin
      .from("favorites")
      .insert({
        user_id: auth.profileId,
        entity_type: validated.entity_type,
        entity_id: validated.entity_id,
      })
      .select()
      .single();

    if (error) {
      // Duplicate — déjà en favori
      if (error.code === "23505") {
        return Response.json(
          { error: { code: "ALREADY_FAVORITED", message: "Déjà en favoris" } },
          { status: 409 },
        );
      }
      throw error;
    }

    return Response.json(data, { status: 201 });
  } catch (err) {
    return handleApiError(err, "FAVORITES_ADD");
  }
}
