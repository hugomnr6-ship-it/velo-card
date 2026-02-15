import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import type { GpxPoint } from "@/types";

/**
 * POST /api/races/[raceId]/gpx
 * Upload and parse GPX data for a race.
 * Body: { gpx_xml: string } — raw GPX XML content
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { raceId } = await params;

  // Get current user profile
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("strava_id", session.user.stravaId)
    .single();

  if (!profile) {
    return Response.json({ error: "Profil introuvable" }, { status: 404 });
  }

  // Verify race exists
  const { data: race } = await supabaseAdmin
    .from("races")
    .select("id, gpx_data, location")
    .eq("id", raceId)
    .single();

  if (!race) {
    return Response.json({ error: "Course introuvable" }, { status: 404 });
  }

  // Parse body
  const body = await request.json();
  const gpxXml: string = body.gpx_xml;

  if (!gpxXml || typeof gpxXml !== "string") {
    return Response.json({ error: "Contenu GPX manquant" }, { status: 400 });
  }

  try {
    // Parse GPX XML to extract track points
    const points = parseGpxXml(gpxXml);

    if (points.length < 10) {
      return Response.json(
        { error: "Le fichier GPX doit contenir au moins 10 points" },
        { status: 400 },
      );
    }

    // Compute distance from start for each point
    let totalDist = 0;
    points[0].distFromStart = 0;
    for (let i = 1; i < points.length; i++) {
      const d = haversine(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon);
      totalDist += d;
      points[i].distFromStart = totalDist;
    }

    // Compute elevation gain
    let elevGain = 0;
    for (let i = 1; i < points.length; i++) {
      const diff = points[i].ele - points[i - 1].ele;
      if (diff > 0) elevGain += diff;
    }

    // Store as gpx_data JSONB
    const gpxData = {
      points,
      totalDistanceKm: Math.round(totalDist * 100) / 100,
      totalElevationGain: Math.round(elevGain),
      maxElevation: Math.round(Math.max(...points.map((p) => p.ele))),
      minElevation: Math.round(Math.min(...points.map((p) => p.ele))),
      centerLat: points[Math.floor(points.length / 2)].lat,
      centerLon: points[Math.floor(points.length / 2)].lon,
      contributor_id: profile.id,
      contributed_at: new Date().toISOString(),
    };

    // Update race with GPX data + auto-fill distance/elevation if missing
    const updates: Record<string, any> = { gpx_data: gpxData };

    // Auto-fill distance and elevation if not set
    const { data: currentRace } = await supabaseAdmin
      .from("races")
      .select("distance_km, elevation_gain")
      .eq("id", raceId)
      .single();

    if (!currentRace?.distance_km) {
      updates.distance_km = Math.round(totalDist * 10) / 10;
    }
    if (!currentRace?.elevation_gain) {
      updates.elevation_gain = Math.round(elevGain);
    }

    const { error } = await supabaseAdmin
      .from("races")
      .update(updates)
      .eq("id", raceId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      stats: {
        points: points.length,
        distanceKm: gpxData.totalDistanceKm,
        elevationGain: gpxData.totalElevationGain,
        maxElevation: gpxData.maxElevation,
      },
    });
  } catch (err: any) {
    console.error("[GPX UPLOAD] Error:", err);
    return Response.json({ error: "Erreur lors du parsing GPX: " + err.message }, { status: 400 });
  }
}

// ——— Simple GPX XML parser ———
function parseGpxXml(xml: string): GpxPoint[] {
  const points: GpxPoint[] = [];

  // Match all <trkpt> elements
  const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/gi;
  const eleRegex = /<ele>([^<]+)<\/ele>/i;

  let match;
  while ((match = trkptRegex.exec(xml)) !== null) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    const inner = match[3];
    const eleMatch = eleRegex.exec(inner);
    const ele = eleMatch ? parseFloat(eleMatch[1]) : 0;

    if (!isNaN(lat) && !isNaN(lon)) {
      points.push({ lat, lon, ele: isNaN(ele) ? 0 : ele, distFromStart: 0 });
    }
  }

  // Also try <rtept> (route points)
  if (points.length === 0) {
    const rteptRegex = /<rtept\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/rtept>/gi;
    while ((match = rteptRegex.exec(xml)) !== null) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      const inner = match[3];
      const eleMatch = eleRegex.exec(inner);
      const ele = eleMatch ? parseFloat(eleMatch[1]) : 0;

      if (!isNaN(lat) && !isNaN(lon)) {
        points.push({ lat, lon, ele: isNaN(ele) ? 0 : ele, distFromStart: 0 });
      }
    }
  }

  return points;
}

// ——— Haversine distance (km) ———
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
