import type { GpxPoint, RouteSummary } from "@/types";

/**
 * Haversine formula — distance between two lat/lon points in km
 */
function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Parse a GPX XML string into an array of GpxPoints
 * Supports both <trkpt> (tracks) and <rtept> (routes)
 */
export function parseGpx(xmlString: string): GpxPoint[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "application/xml");

  // Try track points first, fallback to route points
  let nodes = doc.querySelectorAll("trkpt");
  if (nodes.length === 0) {
    nodes = doc.querySelectorAll("rtept");
  }

  if (nodes.length === 0) {
    throw new Error("Aucun point trouvé dans le fichier GPX");
  }

  const points: GpxPoint[] = [];
  let cumulativeDist = 0;

  nodes.forEach((node, i) => {
    const lat = parseFloat(node.getAttribute("lat") || "0");
    const lon = parseFloat(node.getAttribute("lon") || "0");
    const eleNode = node.querySelector("ele");
    const ele = eleNode ? parseFloat(eleNode.textContent || "0") : 0;

    if (i > 0) {
      const prev = points[i - 1];
      cumulativeDist += haversine(prev.lat, prev.lon, lat, lon);
    }

    points.push({ lat, lon, ele, distFromStart: cumulativeDist });
  });

  return points;
}

/**
 * Compute route summary from parsed GPX points
 */
export function computeRouteSummary(points: GpxPoint[]): RouteSummary {
  if (points.length === 0) {
    throw new Error("Aucun point à analyser");
  }

  const totalDistanceKm = points[points.length - 1].distFromStart;

  // D+ : sum of positive elevation differences
  let totalElevationGain = 0;
  for (let i = 1; i < points.length; i++) {
    const diff = points[i].ele - points[i - 1].ele;
    if (diff > 0) totalElevationGain += diff;
  }

  const elevations = points.map((p) => p.ele);
  const maxElevation = Math.max(...elevations);
  const minElevation = Math.min(...elevations);

  // Center point: find the point closest to half the total distance
  const halfDist = totalDistanceKm / 2;
  let centerPoint = points[0];
  let minDiff = Infinity;
  for (const p of points) {
    const diff = Math.abs(p.distFromStart - halfDist);
    if (diff < minDiff) {
      minDiff = diff;
      centerPoint = p;
    }
  }

  return {
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalElevationGain: Math.round(totalElevationGain),
    maxElevation: Math.round(maxElevation),
    minElevation: Math.round(minElevation),
    points,
    centerLat: centerPoint.lat,
    centerLon: centerPoint.lon,
  };
}
