/**
 * POST /api/weather/route-wind
 * Fetches wind data along a route from Open-Meteo (free, no API key).
 * Input: { points: [{lat, lon, km}], date?: string (ISO) }
 * Output: WindPoint[] with headwind/crosswind calculations
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const points: { lat: number; lon: number; km: number }[] = body.points;
    const targetDate: string | undefined = body.date;

    if (!points || points.length === 0) {
      return Response.json({ error: "Points manquants" }, { status: 400 });
    }

    // Determine target hour for forecast
    const date = targetDate ? new Date(targetDate) : new Date();
    const hourStr = date.toISOString().slice(0, 13) + ":00"; // e.g. "2026-02-15T10:00"

    // Batch request to Open-Meteo — supports multiple locations
    const lats = points.map((p) => p.lat).join(",");
    const lons = points.map((p) => p.lon).join(",");

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto&forecast_days=3`;

    const res = await fetch(url, {
      next: { revalidate: 7200 }, // Cache 2 hours
    });

    if (!res.ok) {
      return Response.json({ error: "Open-Meteo API error" }, { status: 502 });
    }

    const data = await res.json();

    // Open-Meteo returns an array for multiple locations
    const results = Array.isArray(data) ? data : [data];

    const windPoints = points.map((pt, i) => {
      const locationData = results[Math.min(i, results.length - 1)];
      const hourly = locationData?.hourly;

      if (!hourly) {
        return {
          lat: pt.lat,
          lon: pt.lon,
          km: pt.km,
          windSpeed: 0,
          windDirection: 0,
          windGust: 0,
        };
      }

      // Find closest hour index
      const times: string[] = hourly.time || [];
      let hourIndex = 0;
      const targetHour = date.getHours();
      for (let j = 0; j < times.length; j++) {
        if (new Date(times[j]).getHours() === targetHour) {
          hourIndex = j;
          break;
        }
      }

      return {
        lat: pt.lat,
        lon: pt.lon,
        km: pt.km,
        windSpeed: hourly.wind_speed_10m?.[hourIndex] ?? 0,
        windDirection: hourly.wind_direction_10m?.[hourIndex] ?? 0,
        windGust: hourly.wind_gusts_10m?.[hourIndex] ?? 0,
      };
    });

    return Response.json(windPoints);
  } catch (err: any) {
    console.error("[ROUTE-WIND] Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
