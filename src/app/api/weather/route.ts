import { getAuthenticatedUser, isErrorResponse } from "@/lib/api-utils";

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
    // 4. Fetch weather from OpenWeatherMap
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`;
    const res = await fetch(url);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return Response.json(
        { error: errorData.message || "Erreur API météo" },
        { status: res.status },
      );
    }

    const data = await res.json();

    // 5. Transform to WeatherData
    const weather = {
      windSpeedKmh: Math.round(data.wind.speed * 3.6), // m/s → km/h
      windDirection: degreesToCompass(data.wind.deg || 0),
      windDegrees: data.wind.deg || 0,
      temperature: Math.round(data.main.temp),
      description: data.weather?.[0]?.description || "",
      icon: data.weather?.[0]?.icon || "01d",
    };

    return Response.json(weather);
  } catch (err: any) {
    console.error("Weather API error:", err);
    return Response.json(
      { error: err.message || "Erreur lors de la récupération météo" },
      { status: 500 },
    );
  }
}
