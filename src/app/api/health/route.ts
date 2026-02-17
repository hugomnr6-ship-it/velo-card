import { redis } from "@/lib/cache";
import { supabaseAdmin } from "@/lib/supabase";

// NOTE: Supabase JS client utilise des APIs Node.js, incompatible Edge
export const runtime = "nodejs";

/**
 * GET /api/health — Health check endpoint
 * Vérifie la connectivité DB + Redis
 * Utilisé par le monitoring Vercel et les alertes
 */
export async function GET() {
  const checks: Record<string, { status: "ok" | "error"; latencyMs: number }> = {};

  // Check Supabase
  const dbStart = Date.now();
  try {
    await supabaseAdmin.from("profiles").select("id").limit(1);
    checks.database = { status: "ok", latencyMs: Date.now() - dbStart };
  } catch {
    checks.database = { status: "error", latencyMs: Date.now() - dbStart };
  }

  // Check Redis (Upstash)
  const redisStart = Date.now();
  try {
    await redis.ping();
    checks.redis = { status: "ok", latencyMs: Date.now() - redisStart };
  } catch {
    checks.redis = { status: "error", latencyMs: Date.now() - redisStart };
  }

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return Response.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
    },
    {
      status: allOk ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
