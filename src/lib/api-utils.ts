import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import type { ZodSchema } from "zod";

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

/**
 * Classe d'erreur applicative typée.
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Gère une erreur et retourne une Response JSON sécurisée.
 * - Log l'erreur complète côté serveur (console.error)
 * - Retourne un message générique au client (pas de fuite DB)
 */
export function handleApiError(error: unknown, context?: string): Response {
  const prefix = context ? `[${context}]` : "[API]";

  if (error instanceof AppError) {
    console.error(`${prefix} AppError:`, error.code, error.message);
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.statusCode },
    );
  }

  // Erreur Supabase ou inconnue : ne PAS retourner le message brut
  console.error(`${prefix} Unexpected error:`, error);
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "Une erreur est survenue" } },
    { status: 500 },
  );
}

/**
 * Valide des données avec un schéma Zod.
 * Retourne les données typées ou une Response d'erreur 400.
 */
export function validateBody<T>(schema: ZodSchema<T>, data: unknown): T | Response {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: firstError.message,
          field: firstError.path.join("."),
        },
      },
      { status: 400 },
    );
  }
  return result.data;
}

/**
 * Vérifie qu'une string est un UUID v4 valide.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}
