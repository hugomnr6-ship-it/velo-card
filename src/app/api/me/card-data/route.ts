import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/me/card-data
 * Returns the authenticated user's card rendering data
 * (username, avatar, stats, tier, country, betaNumber).
 * Used by the shop page to show skin previews on the user's actual card.
 */
export async function GET() {
  const auth = await getAuthenticatedUser();
  if (isErrorResponse(auth)) return auth;

  try {
    const [{ data: profile }, { data: stats }, { data: betaInfo }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("username, avatar_url, country, country_code")
          .eq("id", auth.profileId)
          .single(),
        supabaseAdmin
          .from("user_stats")
          .select('pac, "end", mon, res, spr, val, ovr, tier')
          .eq("user_id", auth.profileId)
          .single(),
        supabaseAdmin
          .from("beta_testers")
          .select("beta_number")
          .eq("user_id", auth.profileId)
          .single(),
      ]);

    if (!profile) {
      return Response.json({ error: "Profil introuvable" }, { status: 404 });
    }

    return Response.json({
      username: profile.username,
      avatarUrl: profile.avatar_url,
      stats: {
        pac: stats?.pac || 0,
        end: stats?.end || 0,
        mon: stats?.mon || 0,
        res: stats?.res || 0,
        spr: stats?.spr || 0,
        val: stats?.val || 0,
        ovr: stats?.ovr || 0,
      },
      tier: stats?.tier || "bronze",
      country: profile.country || null,
      countryCode: profile.country_code || null,
      betaNumber: betaInfo?.beta_number || null,
    });
  } catch (err) {
    return handleApiError(err, "CARD_DATA");
  }
}
