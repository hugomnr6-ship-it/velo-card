import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, validateBody, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { isUserPro } from "@/services/subscription.service";
import { PRO_GATES } from "@/lib/pro-gates";

// Schéma Zod pour la création d'un parcours
const createRouteSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  gpx_url: z.string().url().nullable().optional(),
  distance_km: z.number().positive("La distance doit être positive"),
  elevation_gain: z.number().min(0, "Le dénivelé doit être positif ou nul"),
  rdi_score: z.number().min(0).max(10).nullable().optional(),
  climb_count: z.number().int().min(0).optional(),
  center_lat: z.number().min(-90).max(90).nullable().optional(),
  center_lng: z.number().min(-180).max(180).nullable().optional(),
});

/**
 * GET /api/routes — Liste les parcours sauvegardés de l'utilisateur.
 */
export async function GET() {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof Response) return authResult;

    const { data: routes, error } = await supabaseAdmin
      .from("saved_routes")
      .select("*")
      .eq("user_id", authResult.profileId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(routes || []);
  } catch (err) {
    return handleApiError(err, "ROUTES_LIST");
  }
}

/**
 * POST /api/routes — Sauvegarder un nouveau parcours.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof Response) return authResult;

    const body = await validateBody(request, createRouteSchema);
    if (body instanceof Response) return body;

    // Vérifier le gate Free/Pro : nombre de parcours max
    const isPro = await isUserPro(authResult.profileId);
    if (!isPro) {
      const { count } = await supabaseAdmin
        .from("saved_routes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", authResult.profileId);

      if ((count ?? 0) >= PRO_GATES.routes.freeMaxSaved) {
        return NextResponse.json(
          {
            error: {
              code: "PRO_REQUIRED",
              message: `Limite de ${PRO_GATES.routes.freeMaxSaved} parcours atteinte. Passe Pro pour sauvegarder sans limite.`,
            },
          },
          { status: 403 },
        );
      }
    }

    const { data: route, error } = await supabaseAdmin
      .from("saved_routes")
      .insert({
        user_id: authResult.profileId,
        name: body.name,
        gpx_url: body.gpx_url ?? null,
        distance_km: body.distance_km,
        elevation_gain: body.elevation_gain,
        rdi_score: body.rdi_score ?? null,
        climb_count: body.climb_count ?? 0,
        center_lat: body.center_lat ?? null,
        center_lng: body.center_lng ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(route, { status: 201 });
  } catch (err) {
    return handleApiError(err, "ROUTES_CREATE");
  }
}
