import { getAuthenticatedUser, isErrorResponse, handleApiError } from "@/lib/api-utils";
import { cached } from "@/lib/cache";
import { withExternalRetry } from "@/lib/retry";

function degreesToCompass(deg: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}

export async function POST(request: Request) {
  // 1. Check auth
  const authResult = await getAuthenticatedUser();
  if (isErrorResponse(authResult)) return authResult;

  // 2. Parse body
  const { lat, lon } = await request.json();
  if (typeof lat !== "number" || typeof lon !== "number") {
    return Response.json(
      { error: "Latitude et longitude requises" },
      { status: 400 },
    );
  }

  // 3. Check API key
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Clé API OpenWeatherMap manquante" },
      { status: 500 },
    );
  }

  try {
    // Cache Redis 30 minutes par coordonnées (arrondi pour grouper les requêtes proches)
    const roundedLat = Math.round(lat * 10) / 10;
    const roundedLon = Math.round(lon * 10) / 10;

    const weather = await cached(
      `${roundedLat}:${roundedLon}`,
      async () => {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`;
        const res = await withExternalRetry(() => fetch(url));

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Erreur API météo");
        }

        const data = await res.json();

        return {
          windSpeedKmh: Math.round(data.wind.speed * 3.6),
          windDirection: degreesToCompass(data.wind.deg || 0),
          windDegrees: data.wind.deg || 0,
          temperature: Math.round(data.main.temp),
          description: data.weather?.[0]?.description || "",
          icon: data.weather?.[0]?.icon || "01d",
        };
      },
      { ttl: 1800, prefix: "weather" }
    );

    return Response.json(weather, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    });
  } catch (err) {
    return handleApiError(err, "WEATHER_GET");
  }
}
