import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

// Routes API qui ne nécessitent PAS d'authentification
const PUBLIC_API_ROUTES = [
  "/api/auth",
  "/api/og",
  "/api/ghost",
  "/api/cron",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip non-API routes
  if (!pathname.startsWith("/api")) return NextResponse.next();

  // Rate limit global (toutes les API, même publiques)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  const rateLimited = await checkRateLimit(ip, "general");
  if (rateLimited) return new NextResponse(rateLimited.body, { status: 429, headers: { "Retry-After": "60" } });

  if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) return NextResponse.next();

  const token = await getToken({ req: request });
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
