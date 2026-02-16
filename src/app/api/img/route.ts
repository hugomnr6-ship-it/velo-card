import { NextRequest } from "next/server";
import { handleApiError } from "@/lib/api-utils";

// Whitelist des domaines autorisés pour le proxy image
const ALLOWED_DOMAINS = [
  "dgalywyr863hv.cloudfront.net", // Strava CDN (avatars)
  "graph.facebook.com",
  "lh3.googleusercontent.com",
  "avatars.githubusercontent.com",
  "*.supabase.co",                 // Supabase Storage
  "connect.garmin.com",
  "wahoofitness.com",
];

/**
 * Vérifie si le hostname est dans la whitelist.
 * Supporte les patterns wildcard (*.supabase.co).
 */
function isAllowedDomain(hostname: string): boolean {
  return ALLOWED_DOMAINS.some((pattern) => {
    if (pattern.startsWith("*.")) {
      const suffix = pattern.slice(1); // ".supabase.co"
      return hostname.endsWith(suffix) || hostname === pattern.slice(2);
    }
    return hostname === pattern;
  });
}

/**
 * Vérifie qu'une URL est sûre (pas d'IP privée, pas de protocole dangereux).
 */
function isSafeUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);

    // Seuls HTTPS et HTTP autorisés
    if (!["http:", "https:"].includes(parsed.protocol)) return false;

    // Bloquer les IPs privées et locales
    const hostname = parsed.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("169.254.") ||   // AWS metadata
      hostname === "[::1]" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return false;
    }

    // Vérifier la whitelist
    if (!isAllowedDomain(hostname)) return false;

    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new Response("Missing url parameter", { status: 400 });
  }

  if (!isSafeUrl(url)) {
    return new Response("URL not allowed", { status: 403 });
  }

  try {
    const response = await fetch(url, {
      redirect: "error", // Ne pas suivre les redirections (anti-SSRF)
      signal: AbortSignal.timeout(5000), // Timeout 5s
    });

    if (!response.ok) {
      return new Response("Failed to fetch image", {
        status: response.status,
      });
    }

    // Vérifier que la réponse est bien une image
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return new Response("Not an image", { status: 400 });
    }

    const buffer = await response.arrayBuffer();

    // Limiter la taille (5MB max)
    if (buffer.byteLength > 5 * 1024 * 1024) {
      return new Response("Image too large", { status: 413 });
    }

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err) {
    return handleApiError(err, "IMG_GET");
  }
}
