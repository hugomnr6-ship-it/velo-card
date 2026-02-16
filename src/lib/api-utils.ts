import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export interface AuthenticatedUser {
  session: any;
  profileId: string;
  stravaId: number;
  provider: string;
}

/**
 * Vérifie l'authentification et récupère le profil utilisateur.
 * Retourne l'utilisateur authentifié ou une Response d'erreur.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

  if (!profile) {
    return Response.json({ error: "Profil introuvable" }, { status: 404 });
  }

  return {
    session,
    profileId: profile.id,
    stravaId: session.user.stravaId,
    provider: session.user.provider,
  };
}

/**
 * Type guard : vérifie si le résultat est une erreur HTTP.
 */
export function isErrorResponse(result: AuthenticatedUser | Response): result is Response {
  return result instanceof Response;
}
