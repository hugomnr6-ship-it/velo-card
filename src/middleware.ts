import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Routes API qui ne nécessitent PAS d'authentification
const PUBLIC_API_ROUTES = [
  "/api/auth",
  "/api/og",
  "/api/ghost",
  "/api/cron",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip non-API routes and public API routes
  if (!pathname.startsWith("/api")) return NextResponse.next();
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
