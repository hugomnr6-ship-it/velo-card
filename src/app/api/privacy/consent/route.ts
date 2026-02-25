import { getAuthenticatedUser, isErrorResponse, handleApiError, validateBody } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { invalidateCache } from "@/lib/cache";
import { consentSchema } from "@/schemas";

/**
 * GET /api/privacy/consent — Retourne l'état actuel du consentement
 */
export async function GET() {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("sharing_consent, sharing_consent_at")
      .eq("id", profileId)
      .single();

    if (error) throw error;

    return Response.json({
      sharing_consent: data?.sharing_consent ?? false,
      sharing_consent_at: data?.sharing_consent_at ?? null,
    });
  } catch (err) {
    return handleApiError(err, "CONSENT_GET");
  }
}

/**
 * POST /api/privacy/consent — Met à jour le consentement
 */
export async function POST(request: Request) {
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;
  const { profileId } = authResult;

  const body = await request.json();
  const validated = validateBody(consentSchema, body);
  if (validated instanceof Response) return validated;

  try {
    const { sharing_consent } = validated;

    // Récupérer l'état actuel
    const { data: current } = await supabaseAdmin
      .from("profiles")
      .select("sharing_consent")
      .eq("id", profileId)
      .single();

    const wasConsenting = current?.sharing_consent === true;

    // Mettre à jour
    const updateData: Record<string, unknown> = {
      sharing_consent,
    };

    if (sharing_consent && !wasConsenting) {
      // Active le consentement
      updateData.sharing_consent_at = new Date().toISOString();
    } else if (!sharing_consent && wasConsenting) {
      // Désactive le consentement
      updateData.sharing_consent_at = null;
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", profileId);

    if (error) throw error;

    // Invalider les caches si le consentement change
    if (sharing_consent !== wasConsenting) {
      await Promise.all([
        invalidateCache("leaderboard:*"),
        invalidateCache("feed:*"),
        invalidateCache("totw:*"),
      ]);
    }

    return Response.json({
      sharing_consent,
      sharing_consent_at: sharing_consent ? updateData.sharing_consent_at : null,
    });
  } catch (err) {
    return handleApiError(err, "CONSENT_POST");
  }
}
