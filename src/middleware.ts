import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, type RateLimitCategory } from "@/lib/rate-limit";

// Routes API qui ne nécessitent PAS d'authentification
const PUBLIC_API_ROUTES = [
  "/api/auth",
  "/api/og",
  "/api/ghost",
  "/api/cron",
  "/api/health",
  "/api/subscribe",
  "/api/webhooks/stripe",
  "/api/races/seed-fsgt",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip non-API routes
  if (!pathname.startsWith("/api")) return NextResponse.next();

  // ═══ Rate Limiting distribué (Upstash Redis) ═══
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || request.headers.get("x-real-ip")
    || "unknown";

  // Déterminer le type de rate limit selon la route
  let rlType: RateLimitCategory = "general";

  if (pathname.startsWith("/api/auth")) rlType = "auth";
  else if (pathname.startsWith("/api/strava/sync")) rlType = "stravaSync";
  else if (pathname.startsWith("/api/users/search")) rlType = "search";
  else if (
    request.method === "POST" &&
    (pathname.startsWith("/api/duels") || pathname.startsWith("/api/clubs") || pathname.startsWith("/api/tournaments"))
  ) rlType = "creation";
  else if (request.method !== "GET") rlType = "sensitive";

  try {
    const { success, headers } = await applyRateLimit(ip, rlType);

    if (!success) {
      return new NextResponse(
        JSON.stringify({ error: "Trop de requêtes. Réessaie dans quelques instants." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...headers },
        },
      );
    }

    // CSRF protection for state-changing methods
    // Skip for /api/auth — NextAuth handles its own CSRF protection
    if (
      !pathname.startsWith("/api/auth") &&
      ["POST", "PUT", "DELETE", "PATCH"].includes(request.method)
    ) {
      const origin = request.headers.get("origin");
      const allowedOrigins = [
        process.env.NEXTAUTH_URL,
        "https://velo-card.vercel.app",
        "https://velocard.app",
        "http://localhost:3000",
      ].filter(Boolean);

      // Allow Vercel preview deployments
      if (origin && !allowedOrigins.includes(origin) && !origin.endsWith(".vercel.app")) {
        return NextResponse.json({ error: "Origin non autorisé" }, { status: 403 });
      }
    }

    if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
      const response = NextResponse.next();
      Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    }

    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Continue avec les headers de rate limit
    const response = NextResponse.next();
    Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  } catch {
    // Si Upstash est down, on laisse passer (graceful degradation)
    if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) return NextResponse.next();

    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
